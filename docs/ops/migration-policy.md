# Политика миграций (откат образа без restore)

Цель: иметь возможность откатить **образ на одну версию назад** без восстановления БД, когда это безопасно.

## Правило: expand → backfill → contract

1. **Expand** — добавить nullable-колонку / новую таблицу / новый код, который пишет в **обе** схемы (старую и новую), читает с fallback.
2. **Backfill** — заполнить новые поля (upgrade-command или фоновая джоба); идемпотентно.
3. **Contract** — в **следующем** релизе удалить старое поле/код чтения legacy.

Между (1) и (3) оба образа (N и N−1) совместимы с одной схемой БД → откат образа безопасен.

## Когда откат образа **небезопасен**

- Удалены колонки/таблицы, которые читает предыдущий образ.
- Сделан destructive rename без переходного периода.
- Upgrade-command записал данные в новый формат без dual-read в N−1.

В этих случаях `deploy.sh` при провале пишет `RESTORE_DB_REQUIRED=yes|maybe`: нужен `pg_restore` из `/opt/crm/backups/pre-<tag>-*.dump` (prod) или daily dump, **затем** предыдущий тег образа.

## Практика форка

- Миграции ядра Twenty идут через entrypoint (`yarn command:prod upgrade`) при старте **server**.
- Свои изменения схемы (когда появятся `packages/smb-*`) — только expand/contract по этой политике.
- Перед prod-тегом: staging прожил на новой версии ≥ одного успешного smoke.
- Upstream-апгрейд (`update/upstream-<тег>`): сначала staging, smoke, потом prod-тег.

## Связь с деплоем

См. [`deploy.md`](deploy.md) (порядок server→worker, rollback) и [`backup-restore.md`](backup-restore.md).
