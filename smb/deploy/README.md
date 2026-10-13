# smb/deploy — артефакты деплоя форка

| Путь | Назначение |
|------|------------|
| `docker-compose.yml` | Staging/prod стек (образ GHCR, loopback ports, мультиворкспейс, S3, общий env server/worker) |
| `.env.example` | Шаблон `/opt/crm/{staging,prod}/.env` (секреты не коммитить) |
| `Caddyfile` | Хосты из окружения (корень + сабдомены компаний), сжатие, кэш `/assets/*`, SSE без буфера, basic auth на staging |
| `bin/deploy.sh` | Идемпотентный деплой + health + rollback |
| `bin/ssh-forced-command.sh` | Разбор `SSH_ORIGINAL_COMMAND` для GHA-ключа |
| `bin/backup-daily.sh` | Daily/weekly dump + rclone |
| `cron/crm-backup.cron` | Пример crontab |
| `smoke/` | Playwright smoke после staging |

Полный runbook: [`docs/ops/deploy.md`](../../docs/ops/deploy.md).
