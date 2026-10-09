#!/usr/bin/env bash
# Create / reset integration-test database default_test on the override Postgres.
#   bash smb/dev/test-db.sh --ensure   # CREATE DATABASE IF NOT EXISTS
#   bash smb/dev/test-db.sh --reset    # DROP + CREATE (destructive)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smb/dev/_common.sh
source "$SCRIPT_DIR/_common.sh"

ACTION=""
for arg in "$@"; do
  case "$arg" in
    --ensure) ACTION=ensure ;;
    --reset) ACTION=reset ;;
    -h|--help)
      echo "Usage: bash smb/dev/test-db.sh --ensure|--reset"
      echo "  DB name: default_test on localhost:${PG_PORT}"
      echo "  For integration tests set:"
      echo "    PG_DATABASE_URL=postgres://postgres:postgres@localhost:${PG_PORT}/default_test"
      exit 0
      ;;
    *)
      fail "неизвестный аргумент: $arg"
      exit 1
      ;;
  esac
done

if [ -z "$ACTION" ]; then
  fail "укажи --ensure или --reset"
  exit 1
fi

cd "$REPO_ROOT"
require_compose_version

if ! compose ps --status running --services 2>/dev/null | grep -qx db; then
  # compose ps format varies; fall back to pg_isready in container
  if ! compose exec -T db pg_isready -U postgres -q 2>/dev/null; then
    fail "контейнер db не запущен — сначала: bash smb/dev/up.sh (или compose up)"
    exit 1
  fi
fi

run_psql() {
  compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "$1"
}

db_exists() {
  compose exec -T db psql -U postgres -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname = 'default_test'" 2>/dev/null | grep -q 1
}

if [ "$ACTION" = ensure ]; then
  if db_exists; then
    ok "default_test уже есть"
  else
    info "CREATE DATABASE default_test…"
    run_psql 'CREATE DATABASE default_test;'
    ok "default_test создана"
  fi
elif [ "$ACTION" = reset ]; then
  info "DROP + CREATE default_test…"
  run_psql 'DROP DATABASE IF EXISTS default_test WITH (FORCE);'
  run_psql 'CREATE DATABASE default_test;'
  ok "default_test пересоздана"
fi
