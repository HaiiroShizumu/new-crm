#!/usr/bin/env bash
# Daily pg_dump -Fc + optional rclone offsite. Retention: 7 daily / 4 weekly.
# Cron example: see smb/deploy/cron/crm-backup.cron
set -euo pipefail

CRM_ROOT="${CRM_ROOT:-/opt/crm}"
ENV_NAME="${1:-prod}"
IMAGE_COMPOSE_DIR="${CRM_ROOT}/${ENV_NAME}"
BACKUP_ROOT="${CRM_ROOT}/backups/${ENV_NAME}"
DAILY_KEEP="${DAILY_KEEP:-7}"
WEEKLY_KEEP="${WEEKLY_KEEP:-4}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}" # e.g. s3crm:crm-backups/prod
HEALTHCHECKS_URL="${HEALTHCHECKS_URL:-}" # ping after success

[[ "$ENV_NAME" =~ ^(staging|prod)$ ]] || { echo "env must be staging|prod" >&2; exit 1; }
[[ -f "${IMAGE_COMPOSE_DIR}/.env" ]] || { echo "missing .env" >&2; exit 1; }

# shellcheck disable=SC1091
set -a && source "${IMAGE_COMPOSE_DIR}/.env" && set +a

stamp="$(date -u +'%Y%m%dT%H%M%SZ')"
dow="$(date -u +%u)" # 1=Mon … 7=Sun
mkdir -p "${BACKUP_ROOT}/daily" "${BACKUP_ROOT}/weekly" "${BACKUP_ROOT}/storage"

compose() {
  docker compose --project-directory "$IMAGE_COMPOSE_DIR" \
    -f "${IMAGE_COMPOSE_DIR}/docker-compose.yml" \
    --env-file "${IMAGE_COMPOSE_DIR}/.env" "$@"
}

dump_path="${BACKUP_ROOT}/daily/db-${stamp}.dump"
echo "dump → ${dump_path}"
compose exec -T db pg_dump -Fc -U "${PG_DATABASE_USER:-postgres}" -d "${PG_DATABASE_NAME:-default}" >"$dump_path"

# Local file storage volume (STORAGE_TYPE=local)
storage_archive="${BACKUP_ROOT}/storage/files-${stamp}.tar.gz"
volume_name="$(compose config --volumes 2>/dev/null | grep server-local-data || true)"
if [[ -n "$volume_name" ]]; then
  # project-prefixed volume name from docker
  full_vol="$(docker volume ls -q | grep "server-local-data" | grep "${CRM_ENV:-$ENV_NAME}" | head -n1 || true)"
  if [[ -n "$full_vol" ]]; then
    docker run --rm -v "${full_vol}:/data:ro" -v "${BACKUP_ROOT}/storage:/out" alpine \
      tar -czf "/out/files-${stamp}.tar.gz" -C /data . || echo "WARN: storage archive failed"
  fi
fi

# Weekly copy on Sunday UTC
if [[ "$dow" == "7" ]]; then
  cp -f "$dump_path" "${BACKUP_ROOT}/weekly/db-${stamp}.dump"
fi

# Retention
ls -1t "${BACKUP_ROOT}/daily"/db-*.dump 2>/dev/null | tail -n +"$((DAILY_KEEP + 1))" | xargs -r rm -f
ls -1t "${BACKUP_ROOT}/weekly"/db-*.dump 2>/dev/null | tail -n +"$((WEEKLY_KEEP + 1))" | xargs -r rm -f
ls -1t "${BACKUP_ROOT}/storage"/files-*.tar.gz 2>/dev/null | tail -n +"$((DAILY_KEEP + 1))" | xargs -r rm -f

if [[ -n "$RCLONE_REMOTE" ]]; then
  rclone copy "$dump_path" "${RCLONE_REMOTE}/daily/"
  [[ -f "$storage_archive" ]] && rclone copy "$storage_archive" "${RCLONE_REMOTE}/storage/" || true
  if [[ "$dow" == "7" ]]; then
    rclone copy "${BACKUP_ROOT}/weekly/db-${stamp}.dump" "${RCLONE_REMOTE}/weekly/"
  fi
fi

if [[ -n "$HEALTHCHECKS_URL" ]]; then
  curl -fsS -m 10 --retry 3 "$HEALTHCHECKS_URL" >/dev/null || true
fi

echo "backup OK ${ENV_NAME} ${stamp}"
