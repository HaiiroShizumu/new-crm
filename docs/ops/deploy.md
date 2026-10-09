# Деплой форка (ходячий скелет)

Конвейер: **коммит → Fork CI → образ GHCR → SSH deploy → (smoke)**.  
Один образ на staging и prod; различие только в `.env` и томах.

| Env | URL | Порт на loopback | Compose dir |
|-----|-----|------------------|-------------|
| staging | `https://dev.crm-systems-ai.ru` | `127.0.0.1:3001` | `/opt/crm/staging` |
| prod | `https://app.crm-systems-ai.ru` | `127.0.0.1:3000` | `/opt/crm/prod` |

**Registry:** `ghcr.io/haiiroshizumu/new-crm`  
**Теги:** `sha-<7>`, подвижный `staging`, `v2.45.6-smb.N`. Тег `latest` запрещён.

## Схема

```text
push main ──► fork-ci (зелёный)
                 │
                 ▼ workflow_run
           fork-release: build-push (linux/amd64)
                 │
                 ├─► tags: sha-… , staging
                 └─► deploy-staging (SSH forced command)
                        └─► smoke-staging (если SMOKE_STAGING_ENABLED)

tag v*-smb.* ──► fork-release: build-push
                    ├─► tags: sha-… , v*-smb.*
                    └─► deploy-prod (environment: production + reviewers)
```

### Один образ + env (почему)

- Dockerfile **не** запекает `REACT_APP_*` / `SERVER_URL` во фронт.
- Браузер берёт API с `window.location.origin` (`packages/twenty-front/src/config/index.ts`).
- `SERVER_URL`, БД, Redis, `ENCRYPTION_KEY` задаются в runtime `.env`.
- Две сборки (staging/prod) **не нужны**.

### Миграции и порядок контейнеров

Entrypoint server (`packages/twenty-docker/twenty/entrypoint.sh`): `database:init:prod` (пустая БД) → `upgrade` → `cron:register:all` → `node dist/main`.  
Worker: `DISABLE_DB_MIGRATIONS=true`, стартует после `server` healthy.  
**Порядок:** db/redis → **server** → **worker** (как в compose).

Health: `GET /healthz` + GraphQL `{ __typename }`.

---

## Bootstrap сервера (ручной чек-лист)

Выполняется на VPS под root/sudo один раз. Пользователь `deploy` — **без sudo**, в группе `docker`.

### 1. Docker, UFW, пользователь

```bash
# Docker Engine + Compose plugin (официальная инструкция Docker для вашего distro)

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

useradd -m -s /bin/bash deploy
usermod -aG docker deploy
# убедиться, что deploy НЕ в sudo
```

### 2. Каталоги

```bash
mkdir -p /opt/crm/{staging,prod,bin,logs,backups,.secrets}
chown -R deploy:deploy /opt/crm
chmod 700 /opt/crm/.secrets
```

### 3. Скопировать артефакты из репо

С машины разработчика или CI:

```bash
# от пользователя с доступом к репо
rsync -a smb/deploy/docker-compose.yml smb/deploy/Caddyfile deploy@SERVER:/opt/crm/
rsync -a smb/deploy/bin/ deploy@SERVER:/opt/crm/bin/
rsync -a smb/deploy/cron/ deploy@SERVER:/opt/crm/cron/

ssh deploy@SERVER 'chmod +x /opt/crm/bin/*.sh'
ssh deploy@SERVER 'cp /opt/crm/docker-compose.yml /opt/crm/staging/ && cp /opt/crm/docker-compose.yml /opt/crm/prod/'
```

### 4. Секреты (бэкапить отдельно от дампов БД)

```bash
sudo -u deploy bash -c '
  umask 077
  ENCRYPTION_KEY=$(openssl rand -base64 32)
  PG_PASS=$(openssl rand -hex 32)
  printf "ENCRYPTION_KEY=%s\n" "$ENCRYPTION_KEY" > /opt/crm/.secrets/staging.env.keys
  printf "PG_DATABASE_PASSWORD=%s\n" "$PG_PASS" >> /opt/crm/.secrets/staging.env.keys
  # то же для prod — ДРУГИЕ значения
  cp /opt/crm/.secrets/staging.env.keys /safe/offline/backup/staging.env.keys
'
```

Без `ENCRYPTION_KEY` (или исторического `APP_SECRET`) зашифрованные поля в БД нечитаемы.

### 5. `.env` per env

```bash
sudo -u deploy cp /path/to/repo/smb/deploy/.env.example /opt/crm/staging/.env
# заполнить TAG, SERVER_URL=https://dev.crm-systems-ai.ru, HOST_PORT=3001,
# ENCRYPTION_KEY, PG_DATABASE_PASSWORD из .secrets
chmod 600 /opt/crm/staging/.env

# prod:
# SERVER_URL=https://app.crm-systems-ai.ru  HOST_PORT=3000  CRM_ENV=prod
chmod 600 /opt/crm/prod/.env
```

`TRUST_PROXY=loopback, linklocal, uniquelocal` — обязателен за Caddy (иначе IP клиента ложный).

### 6. Caddy

```bash
# установить caddy; положить /opt/crm/Caddyfile
caddy hash-password   # вставить хеш вместо STAGING_BASIC_AUTH_HASH
# systemctl enable --now caddy  (или caddy run --config /opt/crm/Caddyfile)
```

DNS A/AAAA на сервер — **когда** освободите хост от старого проекта (см. cutover ниже).

### 7. Pull из GHCR

Под `deploy`:

```bash
# PAT с read:packages (classic) или fine-grained read packages
echo "$GHCR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
```

### 8. SSH forced command для GitHub Actions

На сервере, `~deploy/.ssh/authorized_keys`:

```text
command="/opt/crm/bin/ssh-forced-command.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA... gha-deploy
```

GHA вызывает: `ssh … "staging sha-abc1234"` → `SSH_ORIGINAL_COMMAND` → валидация `^(staging|prod) v?[0-9A-Za-z._-]+$` → `deploy.sh`.

### 9. GitHub Environments / secrets

| Secret / var | Назначение |
|--------------|------------|
| `DEPLOY_SSH_KEY` | приватный ключ gha-deploy |
| `STAGING_HOST` / `PROD_HOST` | IP или hostname |
| `STAGING_USER` / `PROD_USER` | опционально, default `deploy` |
| `STAGING_BASIC_AUTH_*`, `SMOKE_*` | для smoke |
| var `SMOKE_STAGING_ENABLED` | `true` после cutover |
| Environment `production` | **Required reviewers** = вы |

Пока клиентов нет — reviewers можно снять одной настройкой Environment.

### 10. Первый ручной деплой

```bash
sudo -u deploy /opt/crm/bin/deploy.sh staging sha-<7>
# логи: /opt/crm/logs/deploy-staging.log
curl -sf http://127.0.0.1:3001/healthz
```

---

## Ручной деплой и откат

```bash
# деплой
/opt/crm/bin/deploy.sh staging sha-abc1234
/opt/crm/bin/deploy.sh prod v2.45.6-smb.1

# откат образа на previous_tag (скрипт делает это сам при провале health)
PREV=$(cat /opt/crm/prod/.deploy/previous_tag)
/opt/crm/bin/deploy.sh prod "$PREV"
```

Если после неудачного деплоя в логе `RESTORE_DB_REQUIRED=yes|maybe` — **сначала** восстановить дамп (`docs/ops/backup-restore.md`), потом образ. Откат только образа после применённых миграций небезопасен (см. `migration-policy.md`).

---

## Cutover `dev.crm-systems-ai.ru` (когда освободите хост)

Сейчас на домене крутится **старый** проект — не переключать, пока не готовы.

1. Зафиксировать дамп/бэкап старого стека.
2. Остановить старые контейнеры / освободить :80/:443.
3. Поднять Caddy с `/opt/crm/Caddyfile`, DNS уже на этот VPS.
4. `deploy.sh staging sha-…` → health → UI с basic auth.
5. Создать smoke-пользователя; выставить `SMOKE_STAGING_ENABLED=true`.
6. Включить auto `deploy-staging` секретами `DEPLOY_SSH_KEY` + `STAGING_HOST`.

---

## Сборка образа (память раннера)

- Platform: `linux/amd64` (Mac arm64 локально для сервера не годится).
- Front stage в Dockerfile: `NODE_OPTIONS=--max-old-space-size=8192`.
- На стандартном раннере ~7 ГиБ возможен OOM → larger runner **или** правка Dockerfile (это правка ядра → строка в `PATCHES.md`).
- Зафиксировать фактическое время и пик RSS после первого успешного `fork-release` build (сейчас **NOT RUN**).

---

## Чек-лист до первого платящего клиента

- [ ] UFW только 22/80/443
- [ ] `deploy` без sudo, forced SSH command
- [ ] Секреты в `/opt/crm/.secrets/` + offline копия, не в git и не рядом с дампами
- [ ] Отдельные тома/БД staging и prod
- [ ] `ENCRYPTION_KEY` уникален per env; бэкап ключей проверен
- [ ] Caddy HSTS + TLS; staging basic auth
- [ ] `TRUST_PROXY` задан
- [ ] Ежедневный `backup-daily.sh` + rclone offsite
- [ ] Проверочный restore с замером RTO → `backup-restore.md`
- [ ] Smoke на staging зелёный перед первым prod-тегом
- [ ] Environment `production` с reviewers (или осознанно снято)
- [ ] Политика миграций соблюдается (`migration-policy.md`)
- [ ] Мониторинг uptime (UptimeRobot / healthchecks.io) на `/healthz` и ping после бэкапа

---

## Upstream

Ветка `update/upstream-<тег>` → merge → CI → образ → **staging** → smoke → только потом тег `v*-smb.*` в prod.  
См. [`docs/arch/UPSTREAM_BASE.md`](../arch/UPSTREAM_BASE.md).

---

## NOT RUN

| Что | Почему |
|-----|--------|
| Живой deploy на `dev.crm-systems-ai.ru` | На домене ещё старый проект; cutover отложен |
| Prod на `app.crm-systems-ai.ru` | Нет cutover / DNS / секретов GHA |
| Smoke Playwright против staging | `SMOKE_STAGING_ENABLED` выключен до cutover |
| Замер времени/пика RSS сборки на GHA | Нет ещё успешного `fork-release` build в этом скелете |
| Проверочный restore + RTO | См. `backup-restore.md` |
| rclone offsite | Нужны credentials S3-совместимого хранилища |
| OOM-фикс в Dockerfile (6144) | Ждём факта падения на 7 ГиБ раннере |
