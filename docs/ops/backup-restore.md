# Бэкапы и восстановление

## Что бэкапим

| Данные | Как | Где |
|--------|-----|-----|
| PostgreSQL | `pg_dump -Fc` | `/opt/crm/backups/{env}/daily|weekly/` + rclone offsite |
| Файлы (`STORAGE_TYPE=local`) | tar тома `server-local-data` | `/opt/crm/backups/{env}/storage/` + rclone |
| Секреты (`ENCRYPTION_KEY`, пароли) | **отдельно** | `/opt/crm/.secrets/` + offline копия, **не** вместе с дампами |

Скрипт: [`smb/deploy/bin/backup-daily.sh`](../../smb/deploy/bin/backup-daily.sh)  
Cron: [`smb/deploy/cron/crm-backup.cron`](../../smb/deploy/cron/crm-backup.cron)

Retention: **7** дневных, **4** недельных (воскресенье UTC).

Prod pre-deploy dump: `deploy.sh` пишет `/opt/crm/backups/pre-<tag>-<time>.dump` (хранить 14 штук).

## Offsite (rclone)

```bash
# пример remote (S3-совместимый)
rclone config
# затем в cron: RCLONE_REMOTE=s3crm:crm-backups/prod
```

После успешного бэкапа — ping `HEALTHCHECKS_URL` (healthchecks.io / аналог).

## Восстановление БД

```bash
ENV=prod
DUMP=/opt/crm/backups/prod/daily/db-YYYYMMDDTHHMMSSZ.dump

cd /opt/crm/$ENV
docker compose --env-file .env stop server worker
docker compose --env-file .env exec -T db \
  pg_restore -U postgres -d default --clean --if-exists < "$DUMP"
# при необходимости распаковать storage tar в volume
docker compose --env-file .env up -d
```

Проверка: `curl -sf http://127.0.0.1:${HOST_PORT}/healthz` и логин в UI.

## План перехода storage → S3

1. Создать bucket + ключи; прописать `STORAGE_TYPE=S_3`, `STORAGE_S3_*` в `.env`.
2. Синхронизировать `.local-storage` → bucket (разовый `rclone sync` / aws s3 sync).
3. Рестарт server/worker; smoke загрузок файлов.
4. Оставить том local в бэкапах ещё 14 дней, затем убрать из compose volumes при уверенности.

## Проверочное восстановление (RTO)

Бэкап без проверенного restore считается **отсутствующим**.

### Процедура (один раз, затем периодически)

1. Поднять отдельный compose-проект / отдельную БД `restore_test` (не prod volume).
2. `pg_restore` последнего daily dump.
3. Замерить wall-clock от старта restore до `/healthz` + успешный логин.
4. Записать ниже.

### Результат

| Поле | Значение |
|------|----------|
| Дата проверки | **NOT RUN** |
| Dump | — |
| RTO (минуты) | — |
| Кто проверял | — |
| Заметки | Cutover staging/prod ещё не выполнен; restore не гонялся |

---

## NOT RUN

- Первый проверочный restore и замер RTO
- Настройка rclone remote / S3
- Восстановление storage-тома end-to-end
- Healthchecks ping после бэкапа
