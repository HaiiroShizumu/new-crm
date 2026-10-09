#!/usr/bin/env bash
# Forced SSH command for the deploy user.
# authorized_keys example:
#   command="/opt/crm/bin/ssh-forced-command.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... gha-deploy
#
# Expected SSH_ORIGINAL_COMMAND: "<env> <tag>"
#   e.g. "staging sha-abc1234" or "prod v2.45.6-smb.1"
set -euo pipefail

CRM_ROOT="${CRM_ROOT:-/opt/crm}"
DEPLOY_SH="${CRM_ROOT}/bin/deploy.sh"

raw="${SSH_ORIGINAL_COMMAND:-}"

# Exactly two tokens: env + tag
if [[ ! "$raw" =~ ^(staging|prod)[[:space:]]+v?[0-9A-Za-z._-]+$ ]]; then
  echo "rejected SSH_ORIGINAL_COMMAND: ${raw:-<empty>}" >&2
  exit 1
fi

# shellcheck disable=SC2086
set -- $raw
env_name="$1"
tag="$2"

# Strip optional leading v only for validation consistency; pass tag as given
if [[ ! "$env_name" =~ ^(staging|prod)$ ]]; then
  echo "invalid env" >&2
  exit 1
fi
if [[ ! "$tag" =~ ^v?[0-9A-Za-z._-]+$ ]] || [[ "$tag" == "latest" ]]; then
  echo "invalid tag" >&2
  exit 1
fi

exec "$DEPLOY_SH" "$env_name" "$tag"
