# smb/deploy — артефакты деплоя форка

| Путь | Назначение |
|------|------------|
| `docker-compose.yml` | Staging/prod стек (образ GHCR, loopback ports, TRUST_PROXY, log rotation) |
| `.env.example` | Шаблон `/opt/crm/{staging,prod}/.env` (секреты не коммитить) |
| `Caddyfile` | `dev.` / `app.crm-systems-ai.ru`, HSTS, basic auth на staging |
| `bin/deploy.sh` | Идемпотентный деплой + health + rollback |
| `bin/ssh-forced-command.sh` | Разбор `SSH_ORIGINAL_COMMAND` для GHA-ключа |
| `bin/backup-daily.sh` | Daily/weekly dump + rclone |
| `cron/crm-backup.cron` | Пример crontab |
| `smoke/` | Playwright smoke после staging |

Полный runbook: [`docs/ops/deploy.md`](../../docs/ops/deploy.md).
