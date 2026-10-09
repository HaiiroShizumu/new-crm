# Локальная разработка (smb/dev)

Воспроизводимый и экономный стек **без правок ядра**: всё в `smb/dev/` + gitignored `.env`.
Проблемы baseline §0.3 ([docs/arch/00-baseline-analysis.md](../arch/00-baseline-analysis.md)): зависание `generateBarrels` при `NO_COLOR`+`FORCE_COLOR`, конфликт `:5432`, swap ~10 ГБ, `yarn` на Node 22.

## Первый запуск (~10 минут)

1. **Node ^24.5.0** (рекомендуется `.nvmrc` → 24.16.0):

   ```bash
   nvm install 24.16.0
   nvm use 24.16.0
   node -v   # v24.16.0
   ```

2. **Зависимости** (один раз):

   ```bash
   yarn install
   ```

3. **Стек + приложение**:

   ```bash
   bash smb/dev/up.sh
   # или без worker (UI / настройки):
   bash smb/dev/up.sh --lite
   ```

   Скрипт: проверит Node и Compose ≥ 2.24, поставит `core.hooksPath=smb/dev/hooks`,
   поднимет Postgres `:5433` + Redis `:6380`, пропишет `packages/twenty-server/.env`,
   создаст БД `default_test`, запустит `env -u NO_COLOR FORCE_COLOR=1 … yarn start`.

4. Открыть: API [http://localhost:3000](http://localhost:3000), UI [http://localhost:3001](http://localhost:3001).
   Логин E2E: «Continue with Email» + префилл.

5. Диагностика: `bash smb/dev/doctor.sh`. Остановка: `bash smb/dev/down.sh` (`--wipe` удалит volumes).

### Режимы

| Команда | Что поднимает | Когда |
| --- | --- | --- |
| `bash smb/dev/up.sh` | server + front + **worker** | workflow / очереди BullMQ |
| `bash smb/dev/up.sh --lite` | server + front | UI, настройки, метаданные |

## Типичные ошибки

| Симптом | Причина | Что сделать |
| --- | --- | --- |
| `Node version … doesn't match … ^24.5.0` / `up.sh` FAIL | Node 22 или иной major | `nvm use 24.16.0` (скрипт **не** переключает молча) |
| `generateBarrels` / nx задача висит вечно | `NO_COLOR` + `FORCE_COLOR` вместе | запускать через `up.sh` или `env -u NO_COLOR FORCE_COLOR=1 yarn start` |
| `password authentication failed` на `:5432` | чужой Postgres / Cursor extension-host | наш порт **5433** (`compose.override.yml` + `.env`) |
| Compose поднимает и 5432, и 5433 | Compose &lt; 2.24 (нет `!override`) | обновить Docker Desktop / compose plugin ≥ 2.24 |
| `SASL: … client password must be a string` / нет PG URL | нет `.env` | `bash smb/dev/up.sh` или `cp packages/twenty-server/.env.example …` |
| GraphQL doctor WARN | сервер не запущен | сначала `up.sh`, потом `doctor.sh` |
| pre-commit: нет в `docs/PATCHES.md` | правка файла ядра без реестра | добавь строку `P-00N` в `docs/PATCHES.md` (хук подскажет ID и пример) |

## Порты и `.env`

| Сервис | Хост | Контейнер |
| --- | --- | --- |
| Postgres | `localhost:5433` | `5432` |
| Redis | `localhost:6380` | `6379` |
| API / GraphQL | `localhost:3000` | — |
| Front (Vite) | `localhost:3001` | — |

`packages/twenty-server/.env` (gitignore):

```env
PG_DATABASE_URL=postgres://postgres:postgres@localhost:5433/default
REDIS_URL=redis://localhost:6380
```

Интеграционные тесты — отдельная БД `default_test` (не путать с upstream `test` из `setup-dev-env.sh`):

```bash
bash smb/dev/test-db.sh --ensure   # создать
bash smb/dev/test-db.sh --reset    # drop + create
export PG_DATABASE_URL=postgres://postgres:postgres@localhost:5433/default_test
npx nx run twenty-server:test:integration:with-db-reset
```

## Сброс БД

Полный сброс схемы + seed (официальный путь Twenty):

```bash
npx nx database:reset twenty-server
# внутри: миграции + workspace:seed:dev
```

Грубый сброс только данных Postgres (volumes):

```bash
bash smb/dev/down.sh --wipe
bash smb/dev/up.sh --lite   # или полный up.sh
npx nx database:init twenty-server   # если схема ещё не поднята
```

Точечно через psql в контейнере:

```bash
docker compose -p twenty-dev \
  -f packages/twenty-docker/docker-compose.dev.yml \
  -f smb/dev/compose.override.yml \
  exec -T db psql -U postgres -d default -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
npx nx database:reset twenty-server
```

## Git hooks (без husky)

Husky в репозитории **нет** — не добавляем (это была бы правка `package.json` ядра).

```bash
bash smb/dev/install-hooks.sh
# = git config --local core.hooksPath smb/dev/hooks
```

`pre-commit` (бюджет ≤15 с):

1. `scripts/check-core-patches.sh --staged` — правки ядра должны быть в `docs/PATCHES.md`; сообщение подсказывает `P-00N` и формат строки.
2. `oxlint` только по staged `*.{ts,tsx}` (без `--type-aware`); при timeout 15 с — skip, полный lint в CI.

## Спайки без грязного дерева (`git worktree`)

```bash
# из чистого main / рабочей ветки:
git worktree add ../twenty-spike-<topic> -b spike/<topic>
cd ../twenty-spike-<topic>
nvm use
yarn install   # или скопировать/линковать node_modules осторожно
bash smb/dev/up.sh --lite
```

Удаление: `git worktree remove ../twenty-spike-<topic>` (+ `git branch -D spike/<topic>`).

Отдельный worktree → свой working tree; compose project всё ещё `twenty-dev` и те же порты — не поднимай два стека одновременно на одной машине (или смени `-p` / порты в копии override).

## Замеры RAM / swap (до / после)

Машина baseline: 16 ГБ RAM (macOS). Цель: **swap used ≲ 6 ГБ** при штатной работе.

| Момент | Свободно (Pages free) | Swap used / total | Пик RSS node (Twenty) | Примечание |
| --- | --- | --- | --- | --- |
| Baseline §0.3 «до» (10:45) | ~0.1 GiB | 7528M / 9216M | — | полный стек ещё не поднят |
| Baseline §0.3 рабочий режим | 0.1–0.2 GiB | **9789M / 11264M** | 2.2 GiB → 0.4–0.6 GiB | Postgres `:5432` без лимитов + полный `yarn start` + worker |
| После: только compose override (2026-10-08) | ~252 MiB free | **5488M / 7168M** | — | db `memory: 1g`, redis `maxmemory 128mb`, порты 5433/6380 |
| После: `up.sh --lite` (Nest+Vite, 15:46) | ~152 MiB free | **5827M / 6144M** | vite ~395 MiB, server ~132 MiB | GraphQL `{ __typename }` → OK; front `[::1]:3001` → 200 |
| После: полный `up.sh` (с worker) | — | — | — | **NOT RUN**: на 16 ГБ при уже занятом swap ~5.8 ГБ worker не поднимали в этой сессии; ожидаемо +200–400 MiB RSS. Прогон: `bash smb/dev/up.sh` после `nvm use 24.16.0` |

**Цель swap ≲ 6 ГБ — достигнута** на `--lite` (5827M used). Fallback ниже — если после полного `up.sh`+браузер+IDE снова вырастет.

### Если swap снова растёт выше ~6 ГБ

**(а) Docker Desktop → Memory 4 GB**  
Settings → Resources → Memory → 4 GB. Ограничит гипервизор; вместе с `deploy.resources.limits` на `db` снижает давление на host swap.

**(б) Исключить из индексации Cursor**  
Файл `.cursorignore` в корне репозитория = путь вне `smb/`/`docs/`/`scripts/` → нужна строка в `docs/PATCHES.md`, если коммитить. Локально (не коммитя) можно создать:

```gitignore
node_modules/
.nx/
**/dist/
**/.local-storage/
```

**(в) Стек на сервере, IDE локально (не внедряем)**  

1. На Linux-сервере ≥16–32 ГБ: clone репо, `nvm use`, `yarn install`, `bash smb/dev/up.sh`.
2. Проброс портов: `ssh -L 3000:localhost:3000 -L 3001:localhost:3001 -L 5433:localhost:5433 user@host`.
3. В Cursor / VS Code: Remote-SSH к серверу **или** локальный UI на `localhost:3001` через туннель.
4. `.env` на сервере указывает на `localhost:5433` (compose там же).

## Файлы

| Путь | Назначение |
| --- | --- |
| `smb/dev/compose.override.yml` | порты, лимиты, postgres/redis tuning |
| `smb/dev/up.sh` | идемпотентный подъём + start |
| `smb/dev/down.sh` | остановка (`--wipe`) |
| `smb/dev/doctor.sh` | версии, память, health, GraphQL |
| `smb/dev/test-db.sh` | `default_test` ensure/reset |
| `smb/dev/install-hooks.sh` | `core.hooksPath` |
| `smb/dev/hooks/pre-commit` | patches + быстрый oxlint |
| `scripts/check-core-patches.sh` | CI + `--staged` |

Ядро (`packages/twenty-docker/docker-compose.dev.yml`) **не меняем** — только второй `-f`.
