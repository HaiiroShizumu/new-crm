#!/usr/bin/env bash
# Idempotent local stack: compose (override ports) + .env + yarn start.
# Usage (from repo root or anywhere):
#   bash smb/dev/up.sh          # full stack (server + front + worker)
#   bash smb/dev/up.sh --lite   # without worker (UI / settings)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smb/dev/_common.sh
source "$SCRIPT_DIR/_common.sh"

LITE=false
for arg in "$@"; do
  case "$arg" in
    --lite) LITE=true ;;
    -h|--help)
      echo "Usage: bash smb/dev/up.sh [--lite]"
      echo "  default  server + front + worker (workflows)"
      echo "  --lite   server + front only (UI / settings)"
      exit 0
      ;;
    *)
      fail "неизвестный аргумент: $arg (ожидается --lite)"
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

info "проверка Node…"
require_node

info "проверка Docker Compose…"
require_compose_version

info "git hooks…"
bash "$SCRIPT_DIR/install-hooks.sh"

info "docker compose up…"
compose up -d --wait

info "проверка портов…"
check_ports_before_start

info ".env…"
ensure_server_env
ensure_front_env

info "БД default_test…"
bash "$SCRIPT_DIR/test-db.sh" --ensure

info "запуск приложения (NO_COLOR снят, FORCE_COLOR=1, heap 3072)…"
export FORCE_COLOR=1
export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=3072"

if [ "$LITE" = true ]; then
  info "режим --lite: без worker"
  exec env -u NO_COLOR FORCE_COLOR=1 \
    npx nx run-many -t start -p twenty-server twenty-front
else
  info "полный стек (yarn start = server + front + worker)"
  exec env -u NO_COLOR FORCE_COLOR=1 yarn start
fi
