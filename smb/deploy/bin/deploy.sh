#!/usr/bin/env bash
# Idempotent deploy for staging|prod. Run under flock; logs to /opt/crm/logs/.
# Usage: deploy.sh <env> <tag>
#   env: staging|prod
#   tag: image tag in ghcr.io/haiiroshizumu/new-crm (sha-…, staging, v2.45.6-smb.N)
set -euo pipefail

CRM_ROOT="${CRM_ROOT:-/opt/crm}"
IMAGE_REPO="${IMAGE_REPO:-ghcr.io/haiiroshizumu/new-crm}"
HEALTH_TIMEOUT_SEC="${HEALTH_TIMEOUT_SEC:-120}"
PROD_DUMP_RETAIN="${PROD_DUMP_RETAIN:-14}"

ENV_NAME="${1:-}"
TAG="${2:-}"

log() {
  printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

validate_args() {
  [[ "$ENV_NAME" =~ ^(staging|prod)$ ]] || die "env must be staging|prod, got: ${ENV_NAME:-<empty>}"
  [[ "$TAG" =~ ^[0-9A-Za-z._-]+$ ]] || die "invalid tag: ${TAG:-<empty>}"
  [[ "$TAG" != "latest" ]] || die "tag 'latest' is forbidden"
}

wait_health() {
  local base_url="$1"
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SEC))
  while (( SECONDS < deadline )); do
    if curl -sf "${base_url}/healthz" >/dev/null \
      && curl -sf "${base_url}/graphql" \
        -H 'Content-Type: application/json' \
        -d '{"query":"{ __typename }"}' | grep -q '__typename'; then
      log "health OK: ${base_url}"
      return 0
    fi
    sleep 3
  done
  return 1
}

compose() {
  docker compose --project-directory "$ENV_DIR" -f "$ENV_DIR/docker-compose.yml" --env-file "$ENV_DIR/.env" "$@"
}

write_tag() {
  local path="$1"
  local value="$2"
  mkdir -p "$(dirname "$path")"
  printf '%s\n' "$value" >"$path"
}

read_tag() {
  local path="$1"
  if [[ -f "$path" ]]; then
    tr -d '[:space:]' <"$path"
  else
    echo ""
  fi
}

pre_prod_dump() {
  [[ "$ENV_NAME" == "prod" ]] || return 0
  local stamp dump_path
  stamp="$(date -u +'%Y%m%dT%H%M%SZ')"
  dump_path="${CRM_ROOT}/backups/pre-${TAG}-${stamp}.dump"
  mkdir -p "${CRM_ROOT}/backups"
  log "prod pre-deploy dump → ${dump_path}"
  if compose ps --status running -q db >/dev/null 2>&1; then
    # shellcheck disable=SC1091
    set -a && source "$ENV_DIR/.env" && set +a
    compose exec -T db pg_dump -Fc -U "${PG_DATABASE_USER:-postgres}" -d "${PG_DATABASE_NAME:-default}" >"$dump_path" \
      || die "pg_dump failed — aborting deploy"
    # retain last N dumps
    ls -1t "${CRM_ROOT}/backups"/pre-*.dump 2>/dev/null | tail -n +"$((PROD_DUMP_RETAIN + 1))" | xargs -r rm -f
  else
    log "db not running — skip pre-deploy dump (first boot?)"
  fi
}

rollback() {
  local previous="$1"
  log "ROLLBACK: restoring image tag ${previous}"
  if [[ -z "$previous" ]]; then
    log "ROLLBACK: no previous_tag — cannot auto-rollback image"
    log "RESTORE_DB_REQUIRED=unknown (no previous image; inspect logs / dumps manually)"
    return 1
  fi
  # shellcheck disable=SC1091
  set -a && source "$ENV_DIR/.env" && set +a
  TAG="$previous"
  export TAG
  # Rewrite TAG in .env for compose interpolation
  if grep -q '^TAG=' "$ENV_DIR/.env"; then
    sed -i.bak -E "s|^TAG=.*|TAG=${previous}|" "$ENV_DIR/.env" && rm -f "$ENV_DIR/.env.bak"
  else
    printf '\nTAG=%s\n' "$previous" >>"$ENV_DIR/.env"
  fi
  docker pull "${IMAGE_REPO}:${previous}"
  compose up -d
  if wait_health "http://127.0.0.1:${HOST_PORT}"; then
    write_tag "$ENV_DIR/.deploy/current_tag" "$previous"
    log "ROLLBACK: image restored to ${previous}"
    log "RESTORE_DB_REQUIRED=maybe — if migrations from failed tag already applied, image-only rollback is UNSAFE; restore ${CRM_ROOT}/backups/pre-*.dump"
    return 0
  fi
  log "ROLLBACK: health still failing after image restore"
  log "RESTORE_DB_REQUIRED=yes — restore latest dump under ${CRM_ROOT}/backups/ then redeploy previous tag"
  return 1
}

main() {
  validate_args

  ENV_DIR="${CRM_ROOT}/${ENV_NAME}"
  LOG_DIR="${CRM_ROOT}/logs"
  LOCK_FILE="${CRM_ROOT}/logs/deploy-${ENV_NAME}.lock"
  LOG_FILE="${LOG_DIR}/deploy-${ENV_NAME}.log"
  DEPLOY_STATE="${ENV_DIR}/.deploy"

  mkdir -p "$LOG_DIR" "$DEPLOY_STATE" "${CRM_ROOT}/backups"
  [[ -f "$ENV_DIR/.env" ]] || die "missing ${ENV_DIR}/.env"
  [[ -f "$ENV_DIR/docker-compose.yml" ]] || die "missing ${ENV_DIR}/docker-compose.yml"

  exec >>"$LOG_FILE" 2>&1
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    die "another deploy for ${ENV_NAME} is in progress"
  fi

  log "=== deploy start env=${ENV_NAME} tag=${TAG} ==="

  # shellcheck disable=SC1091
  set -a && source "$ENV_DIR/.env" && set +a
  HOST_PORT="${HOST_PORT:?HOST_PORT required in .env}"

  previous="$(read_tag "${DEPLOY_STATE}/current_tag")"
  write_tag "${DEPLOY_STATE}/previous_tag" "${previous}"
  log "previous_tag=${previous:-<none>}"

  # Point .env TAG at the new image
  if grep -q '^TAG=' "$ENV_DIR/.env"; then
    sed -i.bak -E "s|^TAG=.*|TAG=${TAG}|" "$ENV_DIR/.env" && rm -f "$ENV_DIR/.env.bak"
  else
    printf '\nTAG=%s\n' "$TAG" >>"$ENV_DIR/.env"
  fi

  pre_prod_dump

  log "docker pull ${IMAGE_REPO}:${TAG}"
  docker pull "${IMAGE_REPO}:${TAG}"

  # Server runs migrations in entrypoint; worker waits on server healthy (compose depends_on)
  log "compose up -d"
  compose up -d

  if wait_health "http://127.0.0.1:${HOST_PORT}"; then
    write_tag "${DEPLOY_STATE}/current_tag" "$TAG"
    log "=== deploy OK env=${ENV_NAME} tag=${TAG} ==="
    exit 0
  fi

  log "health check failed within ${HEALTH_TIMEOUT_SEC}s"
  if rollback "$previous"; then
    die "deploy failed; rolled back to ${previous} — see RESTORE_DB_REQUIRED above"
  fi
  die "deploy failed; rollback incomplete — see RESTORE_DB_REQUIRED above"
}

main "$@"
