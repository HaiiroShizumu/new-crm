#!/usr/bin/env bash
# Shared helpers for smb/dev/*.sh — source from repo-relative scripts.
set -euo pipefail

SMB_DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SMB_DEV_DIR/../.." && pwd)"
COMPOSE_BASE="$REPO_ROOT/packages/twenty-docker/docker-compose.dev.yml"
COMPOSE_OVERRIDE="$SMB_DEV_DIR/compose.override.yml"
COMPOSE_PROJECT="twenty-dev"
PG_PORT=5433
REDIS_PORT=6380
PG_URL="postgres://postgres:postgres@localhost:${PG_PORT}/default"
REDIS_URL="redis://localhost:${REDIS_PORT}"
REQUIRED_NODE_MAJOR=24
REQUIRED_NODE_MINOR_MIN=5
NVM_HINT="24.16.0"

info() { echo "=> $*"; }
ok() { echo "   ok: $*"; }
warn() { echo "   WARN: $*" >&2; }
fail() { echo "   FAIL: $*" >&2; }

compose() {
  docker compose -p "$COMPOSE_PROJECT" \
    -f "$COMPOSE_BASE" \
    -f "$COMPOSE_OVERRIDE" \
    "$@"
}

require_compose_version() {
  local ver raw major minor
  if ! command -v docker >/dev/null 2>&1; then
    fail "docker не найден"
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    fail "docker compose plugin не найден"
    exit 1
  fi
  raw="$(docker compose version --short 2>/dev/null || docker compose version | head -1)"
  ver="$(echo "$raw" | grep -oE '[0-9]+\.[0-9]+' | head -1)"
  if [ -z "$ver" ]; then
    fail "не удалось разобрать версию compose: $raw"
    exit 1
  fi
  major="${ver%%.*}"
  minor="${ver#*.}"
  minor="${minor%%.*}"
  # !override needs Compose ≥ 2.24 (Compose V2 plugin / Engine Compose ≥ 2.24)
  if [ "$major" -lt 2 ] || { [ "$major" -eq 2 ] && [ "$minor" -lt 24 ]; }; then
    fail "нужен Docker Compose ≥ 2.24 (для !override портов), сейчас: $raw"
    fail "обнови Docker Desktop или пакет docker-compose-plugin"
    exit 1
  fi
  ok "docker compose $raw"
}

require_node() {
  if ! command -v node >/dev/null 2>&1; then
    fail "node не найден; установи Node ^${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR_MIN}.0"
    fail "например: nvm install $NVM_HINT && nvm use $NVM_HINT"
    exit 1
  fi
  local ver major minor
  ver="$(node -v | sed 's/^v//')"
  major="${ver%%.*}"
  minor="$(echo "$ver" | cut -d. -f2)"
  if [ "$major" -ne "$REQUIRED_NODE_MAJOR" ] || [ "$minor" -lt "$REQUIRED_NODE_MINOR_MIN" ]; then
    fail "нужен Node ^${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR_MIN}.0, сейчас v${ver}"
    fail "выполни: nvm use $NVM_HINT"
    fail "(не переключаем автоматически — см. docs/dev/local-env.md)"
    exit 1
  fi
  ok "node v${ver}"
}

# Upsert KEY=VALUE in an env file (create file if missing).
upsert_env() {
  local file="$1" key="$2" value="$3"
  if [ ! -f "$file" ]; then
    printf '%s=%s\n' "$key" "$value" >"$file"
    return
  fi
  if grep -qE "^${key}=" "$file"; then
    # portable in-place: rewrite via temp
    local tmp
    tmp="$(mktemp)"
    awk -v k="$key" -v v="$value" '
      BEGIN { done=0 }
      $0 ~ "^" k "=" { print k "=" v; done=1; next }
      { print }
      END { if (!done) print k "=" v }
    ' "$file" >"$tmp"
    mv "$tmp" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >>"$file"
  fi
}

ensure_server_env() {
  local example="$REPO_ROOT/packages/twenty-server/.env.example"
  local envfile="$REPO_ROOT/packages/twenty-server/.env"
  if [ ! -f "$envfile" ]; then
    if [ ! -f "$example" ]; then
      fail "нет $example"
      exit 1
    fi
    cp "$example" "$envfile"
    ok "создан packages/twenty-server/.env из .env.example"
  fi
  upsert_env "$envfile" "PG_DATABASE_URL" "$PG_URL"
  upsert_env "$envfile" "REDIS_URL" "$REDIS_URL"
  ok "PG_DATABASE_URL → :${PG_PORT}/default, REDIS_URL → :${REDIS_PORT}"
}

ensure_front_env() {
  local example="$REPO_ROOT/packages/twenty-front/.env.example"
  local envfile="$REPO_ROOT/packages/twenty-front/.env"
  if [ ! -f "$envfile" ] && [ -f "$example" ]; then
    cp "$example" "$envfile"
    ok "создан packages/twenty-front/.env из .env.example"
  fi
}

# Print which process holds a TCP listen port (macOS/Linux lsof).
port_holder() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
  else
    warn "lsof недоступен — пропуск проверки порта $port"
  fi
}

check_ports_before_start() {
  local port holder
  for port in 5433 6380; do
    holder="$(port_holder "$port")"
    if [ -z "$holder" ]; then
      fail "порт $port не слушает после compose up"
      exit 1
    fi
    ok "порт $port слушает"
  done
  for port in 3000 3001; do
    holder="$(port_holder "$port")"
    if [ -n "$holder" ]; then
      warn "порт $port уже занят — yarn start может не подняться:"
      echo "$holder" | sed 's/^/      /' >&2
    else
      ok "порт $port свободен"
    fi
  done
}
