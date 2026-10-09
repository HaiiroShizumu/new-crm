#!/usr/bin/env bash
# Stop local docker compose stack (twenty-dev).
#   bash smb/dev/down.sh         # stop containers, keep volumes
#   bash smb/dev/down.sh --wipe  # stop + remove volumes (data loss)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smb/dev/_common.sh
source "$SCRIPT_DIR/_common.sh"

WIPE=false
for arg in "$@"; do
  case "$arg" in
    --wipe) WIPE=true ;;
    -h|--help)
      echo "Usage: bash smb/dev/down.sh [--wipe]"
      exit 0
      ;;
    *)
      fail "неизвестный аргумент: $arg"
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"
require_compose_version

if [ "$WIPE" = true ]; then
  info "compose down -v (данные БД будут удалены)…"
  compose down -v
else
  info "compose down…"
  compose down
fi
ok "стек остановлен"
