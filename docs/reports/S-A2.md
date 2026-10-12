# S-A2 — прототип Discovery: PRE-хук `task.updateOne` из нашего серверного каталога

**Дата:** 2026-10-12 · **Исполнитель:** Hermes · **Ветка:** `chore/docs-and-tooling`
**Вход:** TODO `A2` · `docs/adr/ADR-007-unified-stitch.md` («Прототип (обязателен до утверждения места P-002)»),
`docs/adr/ADR-009-module-contract.md` №3 · гейт владельца (clarify этой сессии): стек поднять ради спайков.

---

## Сделано

| Что | Где |
|---|---|
| Пустой PRE-хук `task.updateOne` (логирует, payload не меняет) | `packages/twenty-server/src/modules/smb-core/hooks/task-update-one-pre.stub.ts` |
| Модуль каркаса, держащий провайдер хука | `packages/twenty-server/src/modules/smb-core/smb-core.module.ts` |
| Агрегатор `SmbServerModule` с маркерами для генератора | `packages/twenty-server/src/modules/smb-server.module.ts` |
| **Шов P-002** — кандидат A: `import` + строка в `imports` | `packages/twenty-server/src/modules/modules.module.ts` (2 строки) |
| Реестр: P-002 — путь заполнен (был зарезервирован пустым), P-019 — новый файл-агрегатор | `docs/PATCHES.md` |
| Демо-компания для прогона | `workspace:seed:dev --light` → Apple, subdomain `apple`, ACTIVE |

Размещение серверной части — **M2** (каталог `packages/twenty-server/src/modules/smb-*`),
по ADR-009 п.4; OURS-гейт расширен этим же циклом (см. `docs/reports/R06.md` §1).

## Подтверждено (команды и вывод)

| Шаг | Команда | Вывод |
|---|---|---|
| сборка сервера | `npx nest build --path ./tsconfig.build.json` | `Successfully compiled: 9867 files with swc` **EXIT=0**; `dist/modules/smb-core/hooks/task-update-one-pre.stub.js` создан |
| линт нашего серверного кода | `npx oxlint -c packages/twenty-server/.oxlintrc.json src/modules/smb-core src/modules/smb-server.module.ts src/modules/modules.module.ts` | `Found 0 warnings and 0 errors. Finished in 6.6s on 4 files with 26 rules` |
| гейт | `bash scripts/check-core-patches.sh --staged` | `OK: все правки ядра записаны в docs/PATCHES.md.` **EXIT=0** |
| сид компании | `node dist/command/command.js workspace:seed:dev --light` | **EXIT=0**, в `core.workspace`: `20202020-1c25-4d02-bf25-6aeccf7ea419 \| apple \| Apple \| ACTIVE` |
| вход | GraphQL `/metadata`: `signIn(email,password)` → `getAuthTokensFromLoginToken(loginToken, origin)` | workspace-токен сохранён в файл, в отчёт не выводился |
| вызов хука | GraphQL `/graphql`: `updateTask(id, data)` (в v2.45.6 GraphQL-имя мутации `updateTask`, ключ хука — `task.updateOne`) | `updateTask OK: {"updateTask": {"id": "20202020-0001-4e7c-8001-123456789def", "title": "Schedule follow-up call ·A2 ·A2"}}` |
| **срабатывание хука** | `grep -c 'smb stub' /opt/data/stack-logs/api-a2.log` | **1** → `[Nest] 39670 - 10/12/2026, 12:38:57 PM LOG [SmbTaskUpdateOnePreHook] smb stub: task.updateOne workspace=20202020-1c25-4d02-bf25-6aeccf7ea419` |

**Вывод:** `WorkspaceQueryHookExplorer` видит провайдер из нашего каталога, когда `SmbServerModule`
подключён через **кандидат A — `src/modules/modules.module.ts`**. Кандидат B
(`workspace-query-hook.module.ts`) не понадобился, P-002 зафиксирован за `modules.module.ts`.

### Побочный результат (важно для остальных спайков)

Первый прогон **не дал срабатывания**: API работал со старым `dist` — `kill` по `api.pid`
не убил процесс (pid в файле не совпал с живым `node dist/main.js`), новая копия не смогла
занять :3000 и зависла. После `kill` по фактическому pid и рестарта хук сработал.
**Правило:** после каждой сборки сервера убивать `node dist/main.js` по pid из `ps`, не по `api.pid`,
и проверять, что `healthz` отвечает **до** прогона.

## Замер M1/M2 для сервера (ADR-009 №3, ADR-007 «Критерии»)

| Критерий | M1 — отдельный пакет `packages/smb-server` | M2 — каталог `packages/twenty-server/src/modules/smb-*` (выбрано) |
|---|---|---|
| Правок существующих файлов ядра | **4 зоны**: корневой `package.json` (`workspaces.packages` — явный список из **19 пакетов, без glob**), `yarn.lock`, `packages/twenty-server/package.json` (154 зависимости, нужна новая), `packages/twenty-docker/twenty/Dockerfile` (**23 строки `COPY ./packages/...` поимённо**) | **1 файл**: `src/modules/modules.module.ts` (импорт + строка в `imports`) |
| tsconfig/алиасы | нужен path-маппинг потребителя | **ноль**: у twenty-server уже есть `paths: { "src/*": ["./src/*"] }` — код лежит под `src/` и резолвится как есть |
| Цикл импортов (та же причина, что на фронте) | `smb-server` импортирует внутренности `twenty-server`, а `twenty-server` → `smb-server`: цикл | нет: код живёт внутри того же пакета |
| Швов на модуль | растёт (свой импорт в каждом точечном месте) | **0**: модуль только регистрируется в `smb-server.module.ts` (маркеры генератора) |
| Конфликты при merge upstream | 4 файла-топа конфликтов | 1 файл с низким churn |

Итог: **M2 выбран и подтверждён прогоном**; аргументация совпадает с фронтовой из ADR-007,
добавляется только число правимых ядерных файлов (4 → 1) и отсутствие правок tsconfig.

## NOT RUN

- `tsc --noEmit` по `packages/twenty-server` — **EXIT=137 (Killed)**: лимит контейнера 6 ГБ,
  swap хоста исчерпан на 99.7% (`SwapFree 4104 kB / 1048572 kB`), `NODE_OPTIONS=--max-old-space-size=4096`
  вместе с уже работающим стеком упирался в `memory.max=6442450944`. Требуется тихий момент
  (стек остановлен) либо VM. Компиляция при этом проходит (SWC), ошибки типов не пойманы.
- Прогон `bats` и `oxlint` фронта — в `docs/reports/R06.md`.
- E-кейсы Битрикс24 (E1/E8/E9/E10) — без тестового портала (O-7 открыт).
- Промежуточные шаги S1/S1a/S3/S4/S4a/S5/S7 — отдельными отчётами.

## Расхождения

1. **ADR-007 обещал «ровно один импорт» P-002 — фактически 2 строки** (импорт + элемент в `imports`),
   как и P-014 на фронте (3 строки). Записано в реестр P-002 дословно.
2. `bats`-кейсы, добавленные этим же циклом (M1-1…M1-5), прогнаны до спайка: **20/20**.
3. Первая попытка прогона (без рестарта API) дала 0 срабатываний — не ошибка хука, ошибка стенда;
   в выводе выше — только второй, корректный прогон.

## Вопросы

1. Заглушку `TaskUpdateOnePreHookStub` оставить как постоянный «канарейку» до появления
   настоящего PRE-хука (T-3) или удалить сразу после фиксации результата в ADR-007?
