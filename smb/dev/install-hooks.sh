#!/usr/bin/env bash
# Point this repo's local hooksPath at smb/dev/hooks (no husky / no package.json change).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOKS_REL="smb/dev/hooks"

cd "$REPO_ROOT"

if [ ! -d "$HOOKS_REL" ]; then
  echo "FAIL: нет каталога $HOOKS_REL" >&2
  exit 1
fi

chmod +x "$HOOKS_REL/pre-commit" 2>/dev/null || true

current="$(git config --local --get core.hooksPath 2>/dev/null || true)"
if [ "$current" = "$HOOKS_REL" ]; then
  echo "   ok: core.hooksPath уже $HOOKS_REL"
  exit 0
fi

git config --local core.hooksPath "$HOOKS_REL"
echo "   ok: git config --local core.hooksPath=$HOOKS_REL"
