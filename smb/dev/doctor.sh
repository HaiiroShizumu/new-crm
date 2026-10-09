#!/usr/bin/env bash
# Diagnose local twenty-dev environment (versions, RAM/swap, ports, health).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=smb/dev/_common.sh
source "$SCRIPT_DIR/_common.sh"

cd "$REPO_ROOT"
STATUS=0

echo "=== versions ==="
if command -v node >/dev/null 2>&1; then
  echo "node:  $(node -v) (need ^${REQUIRED_NODE_MAJOR}.${REQUIRED_NODE_MINOR_MIN}.0)"
  if ! ( require_node ); then
    STATUS=1
  fi
else
  echo "node:  MISSING"
  STATUS=1
fi

if command -v yarn >/dev/null 2>&1; then
  echo "yarn:  $(yarn -v 2>/dev/null || echo '?')"
else
  echo "yarn:  MISSING"
  STATUS=1
fi

if command -v docker >/dev/null 2>&1; then
  echo "docker: $(docker version --format '{{.Server.Version}}' 2>/dev/null || docker -v)"
  if ! ( require_compose_version ); then
    STATUS=1
  fi
  echo "compose: $(docker compose version 2>/dev/null | head -1)"
else
  echo "docker: MISSING"
  STATUS=1
fi


echo ""
echo "=== memory (macOS) ==="
if command -v vm_stat >/dev/null 2>&1; then
  page_size="$(vm_stat | awk '/page size/ {print $8}' | tr -d '.')"
  [ -z "$page_size" ] && page_size=16384
  free_pages="$(vm_stat | awk '/Pages free/ {gsub(/\./,"",$3); print $3}')"
  free_mib=$((free_pages * page_size / 1024 / 1024))
  echo "vm_stat Pages free ≈ ${free_mib} MiB (page_size=${page_size})"
  vm_stat | egrep 'Pages (free|active|inactive|wired|speculative)' || true
else
  echo "vm_stat: NOT RUN (не macOS?)"
fi
if sysctl vm.swapusage >/dev/null 2>&1; then
  sysctl vm.swapusage
else
  echo "vm.swapusage: NOT RUN"
fi

echo ""
echo "=== node RSS (top processes) ==="
ps -axo rss,pid,comm 2>/dev/null | awk 'NR==1 || /node/ {print}' | sort -nr | head -15 || true

echo ""
echo "=== ports ==="
for port in 3000 3001 5433 6380; do
  holder="$(port_holder "$port")"
  if [ -n "$holder" ]; then
    echo ":$port LISTEN"
    echo "$holder" | sed 's/^/  /'
  else
    echo ":$port free"
  fi
done

echo ""
echo "=== compose health ==="
if compose ps 2>/dev/null; then
  if compose exec -T db pg_isready -U postgres -q 2>/dev/null; then
    ok "db pg_isready"
  else
    warn "db не отвечает"
    STATUS=1
  fi
  if compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    ok "redis PONG"
  else
    warn "redis не отвечает"
    STATUS=1
  fi
else
  warn "compose ps не удался — стек не поднят?"
  STATUS=1
fi

echo ""
echo "=== GraphQL ==="
if command -v curl >/dev/null 2>&1; then
  gql="$(curl -sS -m 3 -X POST http://localhost:3000/graphql \
    -H 'Content-Type: application/json' \
    -d '{"query":"{ __typename }"}' 2>/dev/null || true)"
  if echo "$gql" | grep -q '__typename'; then
    ok "GraphQL: $gql"
  else
    warn "GraphQL :3000 не ответил (сервер не запущен?). body=${gql:-empty}"
    STATUS=1
  fi
else
  warn "curl отсутствует"
fi

echo ""
echo "=== git hooks ==="
hooks="$(git config --local --get core.hooksPath 2>/dev/null || echo '(не задан)')"
echo "core.hooksPath=$hooks"
if [ "$hooks" != "smb/dev/hooks" ]; then
  warn "ожидается smb/dev/hooks — запусти: bash smb/dev/install-hooks.sh"
fi

echo ""
if [ "$STATUS" -eq 0 ]; then
  echo "doctor: OK"
else
  echo "doctor: есть проблемы (exit $STATUS) — см. docs/dev/local-env.md"
fi
exit "$STATUS"
