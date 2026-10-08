# 00 — Аудит базовой линии чистого Twenty

**Цель:** зафиксировать состояние «чистого» Twenty как основы для форка-конкурента Битрикс24, без изменения кода.
**Дата аудита:** 2026-10-08.
**Объект:** полный клон `https://github.com/twentyhq/twenty.git` → `/Users/haiiro/SandBox/twenty-core` (создан в ходе аудита; существующие локальные клоны `learn-twenty-crm-react` [shallow + 31 незакоммиченная правка] и `twenty-dev` [форк-ветка] не использовались и не изменялись).
**Условия:** macOS 27 (darwin), Docker 29.6.1, машина ровно 16 ГБ ОЗУ.
**Формат доказательств:** каждое утверждение — `path:line` (пути относительно `/Users/haiiro/SandBox/twenty-core`, если не указано иное); невайденное — «не найдено» + фактическая команда поиска; допущения — `[ПРЕДПОЛОЖЕНИЕ]`.

---

## 0. ПАСПОРТ

### 0.1 Идентификация

| Параметр | Значение | Как получено |
|---|---|---|
| `git describe --tags` | `sdk/v2.45.0-302-g0cd095bfe8` | `git describe --tags` в клоне |
| HEAD (upstream-коммит) | `0cd095bfe886e846c8b0094ca601dac4f82f686e`, 2026-10-08 07:29 +0000, «Save which fields the record creation form shows (#27384)» | `git log -1 --format='%H %cd %s' --date=iso` |
| Последний тег | `sdk/v2.45.0` = `7e1431c84adbb264db98ab8b8d008a8401b6d4d6` (2026-10-02), всего тегов: 602 | `git describe --tags --abbrev=0`; `git tag \| wc -l` |
| Версия monorepo | `0.2.1` (`package.json:62`, name `twenty-monorepo`), license `AGPL-3.0` (`package.json:26`) | чтение `package.json` |
| Node | engines `^24.5.0` (`package.json:21-22`), `.nvmrc` = `24.16.0` | чтение файлов |
| Yarn | `packageManager: yarn@4.13.0` (`package.json:28`), yarn `>=4.0.2` (`package.json:24`), npm запрещён (`"npm": "please-use-yarn"`, `package.json:23`) | чтение файлов |
| `cloc` | **не найдено** — команда `which cloc` → пусто. Замена: `rg --files -g '*.ts*' \| xargs cat \| wc -l` | — |

### 0.2 Размеры (`find packages -maxdepth 1` → 21 пакет; размер = `du -sh packages/*`, LOC = `rg --files -g '*.ts' -g '*.tsx' | xargs -0 cat | wc -l`)

| Пакет | Размер | TS/TSX строк |
|---|---|---|
| twenty-server | 108M | 1 118 813 |
| twenty-front | 105M | 791 081 |
| twenty-docs | 96M | 2 098 |
| twenty-website | 49M | 102 911 |
| twenty-apps | 24M | 149 029 |
| twenty-ui | 7.4M | 73 464 |
| twenty-front-component-renderer | 6.3M | 77 215 |
| twenty-shared | 5.6M | 57 170 |
| twenty-cli | 3.5M | 54 625 |
| twenty-sdk | 3.3M | 51 438 |
| twenty-companion | 2.1M | 8 108 |
| twenty-client-sdk | 1.5M | 37 385 |
| twenty-emails | 1.2M | 2 225 |
| остальные (docker, agent-skills, oxlint-rules, e2e, create-twenty-app, utils, zapier, claude-skills) | ≤476K | ≤6 647 |

Итого: репозиторий 2.5G (из них `.git` 2.0G), 31 609 ts/tsx-файлов, 5 173 784 строки всех файлов (`rg --files -0 | xargs -0 cat | wc -l`).

### 0.3 Что работает: docker/compose и yarn start (full run)

**Инфраструктура — работает.**
`docker compose -f packages/twenty-docker/docker-compose.dev.yml up -d` → контейнеры `twenty-dev-db-1` (postgres:16, `docker-compose.dev.yml:13`) и `twenty-dev-redis-1` (redis:7, `docker-compose.dev.yml:30`), project name `twenty-dev` (`docker-compose.dev.yml:9`), оба healthy. Единственное предупреждение — orphan-контейнеры от прежних экспериментов (`mattermost`), на работоспособность не влияет.

**`yarn install` — падает на Node 22, проходит на Node 24.**
Первый запуск (PATH с `node v22.23.0`): `➤ YN0001: │ Error: Node version v22.23.0 doesn't match the required version, please use ^24.5.0 at Object.constraints (yarn.config.cjs:26:13)` → `Failed with errors in 1m 57s`. Причина — post-install constraints-check из `yarn.config.cjs:26-27` (включён `enableConstraintsChecks: true` в `.yarnrc.yml:1`). С `PATH=/Users/haiiro/.nvm/versions/node/v24.16.0/bin` → `yarn install` → `Done with warnings in 44s 814ms` (warnings — только peer-зависимости). Примечание: `.yarnrc.yml` задаёт `enableScripts: false` (build-скрипты зависимостей отключены штатно).

**`yarn start` — работает после 4 обходов препятствий (все — конфигурация/окружение, код не менялся):**

1. **Зависание генерации barrel-файлов (воспроизведено 3 раза).** Задача `twenty-shared:generateBarrels` (`packages/twenty-shared/project.json:68-77`) вешается после выполнения скрипта: `main()` отрабатывает (16 index.ts перезаписаны), процесс не завершается. Изолированный запуск `npx tsx packages/twenty-shared/scripts/generateBarrels.ts` → exit 0 за 1.3с; через nx → вечное ожидание. Триггер — одновременные `NO_COLOR=1` + `FORCE_COLOR=true` в окружении задачи:
   - nx конвертирует `FORCE_COLOR=0` в `NO_COLOR=1` и удаляет `FORCE_COLOR` (`node_modules/nx/dist/bin/nx.js:7-10`);
   - task-env ставит задачам `FORCE_COLOR='true'`, т.к. переменная стала `undefined` (`node_modules/nx/dist/src/tasks-runner/task-env.js:19`);
   - реплика `NO_COLOR=1 FORCE_COLOR=1 npx tsx <скрипт>` → зависание (подтверждено), `NO_COLOR=1` или `FORCE_COLOR=1` по отдельности → exit 0; тривиальный скрипт с той же комбинацией → exit 0.
   - **Обход:** запуск `env -u NO_COLOR FORCE_COLOR=1 yarn start` — генерация и все задачи проходят.
   - `[ПРЕДПОЛОЖЕНИЕ]` точный внутренний механизм зависания (tsx/деп-граф + color env при завершении процесса) не локализован; воспроизводимость и триггер доказаны экспериментально.
2. **Отсутствует `.env` сервера.** Без него — `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` (поле `PG_DATABASE_URL` объявлено `@IsDefined()`, `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts:1390-1397`). Официальный setup: `cp packages/twenty-server/.env.example packages/twenty-server/.env` (строка `PG_DATABASE_URL=postgres://postgres:postgres@localhost:5432/default` — `.env.example:3`); `.env` в `.gitignore` (`**/**/.env`, `.gitignore:1`), git-дерево осталось чистым (`git status --porcelain` — пусто).
3. **Конфликт порта 5432.** После настройки `.env` — `password authentication failed for user "postgres"`: на `localhost:5432` дополнительно слушает расширение-хост другого окна Cursor (процесс `Cursor Helper (Plugin): extension-host ... new-crm`), перехватывающее соединение. Проверка `node` + `pg`: `localhost` → ошибка аутентификации; `192.168.0.69` (LAN-IP) → `OK, inet_server_addr()=172.21.0.2` (docker). Обход: `PG_DATABASE_URL=...@192.168.0.69:5432/default` в `.env` (адрес зависит от DHCP — для постоянного решения нужен свой порт/хост). `redis://localhost:6379` конфликта не имеет.
4. **Итоговый запуск:** `env -u NO_COLOR FORCE_COLOR=1 yarn start` (скрипт `package.json:70`: concurrently → `nx run-many -t start -p twenty-server twenty-front` + `wait-on tcp:3000 && nx run twenty-server:worker`).
   - `Nest application successfully started` (через ~2.5 мин после старта, тёплый nx-кэш);
   - GraphQL: `POST localhost:3000/graphql {"query":"{ __typename }"}` → `{"data":{"__typename":"Query"}}`;
   - Фронт: `http://localhost:3001/` → HTTP 200 (HTML SPA; vite слушает `[::1]:3001` — IPv6-loopback);
   - Worker: процесс `dist/queue-worker/queue-worker` запущен, BullMQ крон-очереди активны;
   - Ошибок в логе всего 6 — все разовые `Redis SocketClosedUnexpectedlyError` в момент 11:48:43 (контейнер redis при этом healthy, `docker logs` чист); повторов не было.

**RAM (замер; `free -h` на macOS отсутствует — команда `free -h` → «command not found», использованы `vm_stat` + `sysctl vm.swapusage` + `ps`):**

| Момент | Свободно | Пик RSS node-процессов (node/nx/vite/esbuild) | Swap |
|---|---|---|---|
| До (10:45, базовая линия) | 0.1 GiB free; active 4.3 GiB; wired 3.1 GiB | — | used 7528M / total 9216M |
| Сборка/первый старт (11:00) | 0.0–0.1 GiB | **2.5 GiB** (11:00:39) | used рос до 9856M, total расширен до 11264M |
| Рабочий режим (11:47+, стек поднят) | 0.1–0.2 GiB | 2.2 GiB пик, далее 0.4–0.6 GiB | used 9789M / 11264M |

Машина формально ровно 16 ГБ (условие «<16 ГБ» не выполняется), **ничего не упало**: `yarn install` и `yarn start` доведены до рабочего стека. Но фактически ресурс на пределе: свободной памяти 0.0–0.2 GiB практически всё время, swap вырос с 7.5 до 9.9 ГБ (объём swap-файла macOS расширен с 9 до 11 ГБ) — тяжёлый пейджинг. На такой машине параллельный запуск полного стека + браузера + IDE возможен, но без запаса; для комфортной разработки нужно ≥32 ГБ или отключение посторонних нагрузок.

---

## 1. МЕХАНИЗМЫ РАСШИРЕНИЯ БЕЗ ПРАВКИ ЯДРА (ключевой раздел)

```mermaid
flowchart TD
  subgraph apps [Twenty App manifest]
    M["Manifest: objects, fields, views, logicFunctions, frontComponents, roles, pageLayouts, commandMenuItems, workflows..."]
  end
  CLI["twenty CLI: init, apply, dev, pull, uninstall"]
  subgraph server [twenty-server]
    Install["installApplication / applyManifestToWorkspace"]
    Meta["Метаданные: core schema (objectMetadata, fieldMetadata) + workspace schema"]
    QHooks["WorkspaceQueryHook (pre/post CRUD)"]
    Ev["Database events (ORM EventEmitter)"]
    WH["Исходящие вебхуки + workflow DB-triggers"]
    SSE["GraphQL SSE подписки (RedisPubSub)"]
  end
  subgraph front [twenty-front]
    Tabs["PageLayout tabs + widgets (данные-Driven)"]
    CM["Command menu items (данные-Driven)"]
    Theme["ThemeProvider overrides + CSS vars --t-*"]
    StaticRoutes["Статический роутинг createWorkspaceRouteObjects"]
  end
  M --> CLI
  CLI -->|"GraphQL API (per-workspace)"| Install
  Install --> Meta
  Meta --> Tabs
  Meta --> CM
  QHooks --> Meta
  Ev --> WH
  Ev --> SSE
  Ev -->|"database event trigger"| Server2["Workflow engine"]
```

### a) Twenty Apps / twenty-sdk / twenty-apps

**Что это:** декларативный манифест приложения — почти всё описание расширения данными.

- Единый тип `Manifest`: `packages/twenty-shared/src/application/manifestType.ts:36-60` — `application`, `objects`, `fields`, `indexes`, `logicFunctions`, `frontComponents`, `permissionFlags`, `roles`, `skills`, `agents`, `connections`, `views`, `viewFields`, `navigationMenuItems`, `pageLayouts`, `pageLayoutTabs`, `pageLayoutWidgets`, `commandMenuItems`, `timelineActivityTypes`, `settingsMenuItems`, `workflows`, `translations`, `publicAssets`.
- Авторские API (`define*`): `packages/twenty-sdk/src/sdk/define/` — `define-object.ts`, `define-field.ts`, `views/`, `roles/`, `logic-functions/`, `front-component/`, `command-menu-items/`, `navigation-menu-items/`, `page-layouts/`, `agents/`, `skills/`, `indexes/`, `connection-providers/`, `settings-menu-items/`, `timeline-activity-types/`, `application/`.
- Триггеры logic functions в манифесте: `cronTriggerSettings`, `databaseEventTriggerSettings`, `httpRouteTriggerSettings`, `serverRouteTriggerSettings`, `toolTriggerSettings`, `workflowActionTriggerSettings` — `packages/twenty-cli/src/app/manifest/types/pre-install-logic-function-config.type.ts:6-12`.
- CLI: бинарник `twenty` (`packages/twenty-cli/package.json:2,15`); команды `twenty app init|add|build|typecheck|plan|apply|dev|pull|uninstall|exec|logs` (`packages/twenty-cli/docs/commands.md:185-464`). Scaffold: `create-twenty-app` (`packages/create-twenty-app/package.json:2,6`).

**Установка/удаление (серверный жизненный цикл):**
- GraphQL-резолвер: `installApplication` (`packages/twenty-server/src/engine/core-modules/application/application-install/application-install.resolver.ts:149-183`), `triggerUninstallApplicationJob` (`:218-247`), `uninstallApplication` (`:343-372`), `updateApplication` (`:304-320`).
- Шаги: `APPLICATION_INSTALL_STEPS = ['RESOLVE_PACKAGE','CREATE_APPLICATION','WRITE_FILES','PRE_INSTALL_HOOK','APPLY_MANIFEST','POST_INSTALL_HOOK','FINALIZE']` (`.../application-install/constants/application-install-steps.constant.ts:1-8`); порядок вызовов `runPreInstallHook → applyManifestToWorkspace → runPostInstallHook` (`application-install.service.ts:428-471`).
- **Привязка к workspace — да:** сущность `application` в схеме `core` с индексом `(universalIdentifier, workspaceId)` (`packages/twenty-server/src/engine/core-modules/application/application.entity.ts:39-49`), колонки `version` (`:81-83`), `autoUpgrade` (`:175-179`), `state` (`:88-97`), cascade-связи с сущностями app (`:236-283`); guard-ы `SettingsPermissionGuard(APPLICATIONS)` + `ApplicationTargetGuard` + `@AuthWorkspace()` на всех мутациях (`application-install.resolver.ts:112-183`).
- **Версионирование и миграции — есть:** правило строго возрастающей версии и запрет даунгрейда (`packages/twenty-docs/developers/extend/apps/operations/sync-and-recovery.mdx:34`, `publishing.mdx:375`); апгрейд-сервис `findApplicationsToUpgrade → upgradeApplication` (`.../application-upgrade/application-upgrade.service.ts:51-293`); при обновлении выполняется тот же конвейер pre/post-install, миграция метаданных — `application-manifest-migration.service.ts:162` (`syncMetadataFromManifest` → `WorkspaceMigrationValidateBuildAndRunService`). Хуки апгрейда: `preInstallLogicFunction/postInstallLogicFunction/uninstallLogicFunction/healthCheckLogicFunction` (`packages/twenty-shared/src/application/applicationType.ts:39-42`), флаг `shouldRunOnVersionUpgrade` (`pre-install-logic-function-config.type.ts:15`). В dev-режиме install пропускается (`application-install.service.ts:111-119`; docs `install-hooks.mdx:50`).
- Примеры app: `packages/twenty-apps/examples/{postcard,document-generator,hello-world,media-notes}`, публичные `packages/twenty-apps/public/{slack,linear,teams,discord,...}`.

**Ограничения:**
- Не найдено: регистрация серверных query-hook'ов из app — `rg -l "WorkspaceQueryHook" packages/twenty-apps packages/twenty-sdk/src packages/twenty-front/src` → 0 (заменой служат database-event-триггеры logic functions).
- Не найдено: произвольные GraphQL-резолверы/guard'ы из app — `rg -l "Resolver" packages/twenty-sdk/src` → пусто (есть HTTP-роуты через `httpRouteTriggerSettings`).
- Кросс-app ссылки запрещены (`packages/twenty-docs/developers/extend/apps/layout/page-layouts.mdx:156`); front-компоненты изолированы: Web Worker + Remote DOM, «partial DOM, so advanced usages can fail» (`.../layout/overview.mdx:57,59`).
- **«Беседы» и «Процессы» через app: да, в значительной мере** — манифест включает `pageLayoutTabs/pageLayoutWidgets` (вкладка «Чат»), `frontComponents` (свой виджет), `workflows` (процессы), `logicFunctions` с `databaseEventTriggerSettings`/`httpRouteTriggerSettings`. Не покрывается: серверные CRUD-хуки, произвольные резолверы, собственные типы виджетов UI (см. e).

### b) Метаданные: standard objects, seeds, flat-metadata

- Реестр стандартных объектов: `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts:9` (`STANDARD_OBJECTS`), UUID — `standard-object-universal-identifiers.constant.ts:21-27` (`person`, `company`, `note`, `task`, `taskTarget`, `noteTarget`, `workflow`), поля — `standard-object-fields.constant.ts`.
- Серверные билдеры: `STANDARD_FLAT_OBJECT_METADATA_BUILDERS_BY_OBJECT_NAME` (`packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts:17`); пообъектные билдеры полей рядом (напр. `.../field-metadata/compute-task-standard-flat-field-metadata.util.ts`).
- «Twenty Standard Application» — тоже `Application`-сущность (`.../twenty-standard-application/constants/twenty-standard-applications.ts:11-26`, version `1.0.1`).
- Создание схемы workspace: `workspaceManagerService.init` → `createWorkspaceDBSchema` (`workspace-manager.service.ts:48`, реализация `workspace-schema.service.ts:34`) → `createTwentyStandardApplication` (`:63`) → `synchronizeTwentyStandardApplicationOrThrow` (`:67`) → `setupDefaultRoles` (`:77-88`); строка workspace создаётся в `sign-in-up.service.ts:693`, activate — `workspace.service.ts:480,528`.
- Custom-объекты через metadata API: `createOneObject/updateOneObject/deleteOneObject` (`packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.resolver.ts:361-402`).
- Flat-metadata: типы `packages/twenty-server/src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type.ts`, `flat-field-metadata/types/flat-field-metadata.type.ts`; кэш `getOrRecompute` (`workspace-cache/services/workspace-cache.service.ts:224`).
- Dev-seeder: команда `workspace:seed:dev` (`packages/twenty-server/src/database/commands/data-seed-dev-workspace.command.ts:17`), код `.../dev-seeder/` (`dev-seeder-metadata.service.ts:68,191,224,237,267`).
- Жизненный цикл апгрейдов: команда `upgrade` — «Upgrade workspaces to the latest version» (`packages/twenty-server/src/database/commands/upgrade-version-command/upgrade.command.ts:27-29`), каталоги версий `upgrade-version-command/1-21 … 2-47`; per-workspace миграции validate→build→run (`workspace-migration-validate-build-and-run-service.ts:91-237`); core TypeORM-миграции `packages/twenty-server/src/database/typeorm/core/`.
- **Как добавить свой объект как «standard»:** не найдено команды/документации — `rg -in "add a new standard object|creating a standard object|new standard object" packages/twenty-docs -g '*.mdx'` → 0. Фактический путь — правка кода сервера: билдер в `create-standard-flat-object-metadata.util.ts:17` + UUID в `twenty-shared` `[ПРЕДПОЛОЖЕНИЕ по отсутствию иного механизма]`. App-расширение стандартных объектов полями — штатное (`.../apps/data/extending-objects.mdx:7,41`, `defineField()`).
- Флаг `isCustom` у объектов удалён (`object-metadata.entity.ts:124` — `WasRemovedInUpgrade`), остался `isSystem` (`:133`) — разделение теперь фактически «Twenty Standard Application vs app-owned» `[ПРЕДПОЛОЖЕНИЕ]`.

### c) Серверные хуки (pre/post на CRUD)

- Декоратор: `WorkspaceQueryHook` — `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator.ts:9-37`; фазы только `PRE_HOOK`/`POST_HOOK` (`types/workspace-query-hook.type.ts:19-22`).
- Поддерживаемые операции: `createOne/createMany/updateOne/updateMany/deleteOne/deleteMany/destroy*/restore*/findOne/findMany/findDuplicates/mergeMany/groupBy` (`workspace-query-hook.type.ts:23-53`, общий тип `workspace-resolvers-builder.interface.ts:127-129`).
- Регистрация — Discovery по метаданным, не статический список: `workspace-query-hook.explorer.ts:48-57,225-256`; storage `workspace-query-hook.storage.ts:21,31,42`. **Но модуль с хуком должен быть импортирован:** список хук-модулей — `packages/twenty-server/src/modules/modules.module.ts:3-11,43-51` (в т.ч. `TaskQueryHookModule` `:10,50`).
- Исполнение: ключ `${objectName}.${methodName}` и мерж pre-hook'ом аргументов `payload = merge(payload, hookPayload)` (`workspace-query-hook.service.ts:26-51`), post-hook'и — после коммита (`common-base-query-runner.service.ts:215-220,277-287` через `transactionScope.afterCommit`). Это общий слой — работает и для GraphQL, и для REST (`rest-api-create-one.handler.ts:8,47`).
- Примеры: workspace-member (11 хуков, отказ в правах — `workspace-member-update-many.pre-query.hook.ts:16,26-29` с `@WorkspaceQueryHook('workspaceMember.updateMany')`), task (`packages/twenty-server/src/modules/task/query-hooks/task-delete-many.post-query.hook.ts:13-16` — `@WorkspaceQueryHook({key:'task.deleteMany', type: POST_HOOK})`), workflow (`.../workflow/common/query-hooks/workflow-update-one.post-query.hook.ts`), note, dashboard, timeline, messaging, calendar, blocklist, actor (`.../actor/query-hooks/updated-by.update-one.pre-query-hook.ts` — мутация аргументов).
- **Можно ли валидацию на `task.updateOne` — да, штатно:** (1) класс с `@WorkspaceQueryHook({key:'task.updateOne', type: PRE_HOOK})`, (2) в `providers` модуля `.../task/query-hooks/task-query-hook.module.ts:9-19` (уже импортирован в `modules.module.ts:50`), (3) Explorer зарегистрирует автоматически. Отказ — через `throw new PermissionsException(...)` (образец `workspace-member-update-many.pre-query.hook.ts:29`).
- Не найдено декларативного «списка хуков»: `rg -n "registerWorkspaceQueryHookInstance\|HOOKS\s*=" .../workspace-query-hook` → только storage (`storage.ts:31,42`).
- **Для «Бесед»/«Процессов»:** валидация и мутация аргументов на любом CRUD — да; произвольная серверная логика из app — нет (см. a).

### d) События и подписки

- **Database events — in-process EventEmitter, НЕ PG-триггеры:** не найдено `CREATE TRIGGER|pg_trigger|pg_notify` — `rg -ln "CREATE TRIGGER|pg_trigger|pg_notify" packages/twenty-server/src` → 0; не найдено outbox — `rg -ln "outbox" packages/twenty-server/src -i` → 1 файл (слово «outbox» в контексте почты). Эмиссия из ORM: `workspace-repository.ts:1392-1421` (`emitCreateEvents → eventEmitterService.emitDatabaseBatchEvent`); имя события `${objectName}.${action}` (`compute-event-name.ts:3-9`).
- Диспетчер: `entity-events-to-db.listener.ts:53-84` (`@OnDatabaseBatchEvent('*', CREATED|UPDATED|DELETED|RESTORED|DESTROYED|UPSERTED)`) → вебхуки (`:189`), database-event-триггеры logic functions (`:214-215`), логи/timeline, реалтайм-публикация клиенту (`:104,126` `objectRecordEventPublisher.publish`).
- **Исходящие вебхуки:** сущность `webhook` (schema `core`) с `targetUrl`, `operations` (default `['*.*']`), `secret` (`webhook.entity.ts:14-31`); матчинг `find-webhooks-matching-event-name.util.ts`, подпись HMAC-SHA256 (`call-webhook.job.ts:44`) и отправка (`:112`); REST CRUD `webhook.controller.ts:35` под `PermissionFlagType.API_KEYS_AND_WEBHOOKS`.
- **Входящие вебхуки для пользователей — не найдено универсального:** `rg -ln "incoming webhook|webhook.*receiver" packages/twenty-server/src` → 0. Есть: вебхуки провайдеров (`messaging-webhooks.controller.ts:24`, `connected-account-sync-webhooks.controller.ts:30`, `billing-webhook`), HTTP-роуты logic functions (`route-trigger.service.ts`), workflow-trigger controller (см. §3).
- **SSE/подписки клиенту:** резолвер `@Subscription onEventSubscription` (`packages/twenty-server/src/engine/subscriptions/event-stream.resolver.ts:75-89`) + `addQueryToEventStream/removeQueryFromEventStream` (`:216-264`); pub/sub — `RedisPubSub` (`redis-client.service.ts:5,59` из `graphql-redis-subscriptions`), каналы `EVENT_STREAM_CHANNEL:{workspaceId}:{id}` (`subscription.service.ts:33-49`), публикация записей `object-record-event-publisher.ts:85,303`. Клиент: `graphql-sse` (`packages/twenty-front/src/modules/sse-db-event/components/SSEClientEffect.tsx:12,58-66` → `POST {SERVER}/metadata`), подписка `useTriggerEventStreamCreation.ts:93-97`, документ `OnEventSubscription.ts:3-30` (`objectRecordEventsWithQueryIds`, `metadataEvents`, `queueJobEvents`).
- Workflow-triggers на событиях: `workflow-database-event-trigger.listener.ts:17,76-145`.

### e) Фронт: страницы, табы карточки, поля, действия

- **Маршруты — статический массив, реестра динамической регистрации НЕТ:** `createWorkspaceRouteObjects` (`packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx:81`, lazy-страницы `:14-71`, `RecordShowPage` `:38`, `path: AppPath.RecordShowPage` `:134`); каталог путей `AppPath` (`packages/twenty-shared/src/types/AppPath.ts:24-29`); сборка `useCreateWorkspaceAppRouter.tsx:103`. Не найдено: `rg -n "registerRoute|extraRoutes|customRoute" packages/twenty-front/src` → 0 (совпал только нерелевантный `registerRoutedFlowStateScopeRelease`). Дата-driven страница существует: `/page/:pageLayoutId` (standalone page layout, `createWorkspaceRouteObjects.tsx:44,143`), пункт меню типа `PAGE_LAYOUT` (`NavigationMenuItemType.ts:1-8`).
- **Табы карточки — данные (pageLayoutTab), не хардкод:** карточка `RecordShowPage.tsx:21 → RecordShowPageShell.tsx:115 → PageLayoutRecordPageRenderer.tsx:40,96 → PageLayoutRenderer → PageLayoutTabsRenderer.tsx:211-298 → PageLayoutMainContent → WidgetContentRenderer.tsx:30` (switch по `WidgetType`: `:46` TIMELINE, `:58` CHAT, `:85` FRONT_COMPONENT, default `:103`). Стандартные табы — в серверном шаблоне: `standard-page-layout-tabs.template.ts:73` (`TAB_PROPS`: Timeline `:81`, Tasks `:87`, Notes `:93`, Files `:99`, **Chat `:119`**, widget chat `:238` `WidgetType.CHAT`). У карточки task их только 2 — `home` и `note` (`standard-task-page-layout.config.ts:20-63`); у person/company — 8 (`standard-person-page-layout.config.ts:18-147`). Enum `WidgetType` (сгенерённый): `packages/twenty-front/src/generated-metadata/graphql.ts:7838-7865` (включает `CHAT`, `CHAT_THREADS`, `IFRAME`, `FRONT_COMPONENT`).
- **Где добавить вкладку «Чат»:** (A) правка стандартного конфига в форке `standard-task-page-layout.config.ts:20` по образцу `standard-agent-chat-thread-page-layout.config.ts:19-30` + universalIdentifier в `standard-page-layout-universal-identifiers.constant.ts:253`; (B) без правки кода — штатный режим кастомизации (`PageLayoutTabList.tsx:400-495`, `usePageLayoutAddTabStrategy.ts:37-55`, `useCreatePageLayoutTab.ts:46-65`) — но `WidgetType.CHAT` в side-panel селекторе не выбирается (`SidePanelPageLayoutRecordPageWidgetTypeSelect.tsx:355-401`); (C) свой виджет через `WidgetType.FRONT_COMPONENT` (`FrontComponentWidgetRenderer.tsx:27-30`) — без правок ядра. Важно: `WidgetType.CHAT` — это **AI-чат записи** (`ChatWidget.tsx:20-40`, `AiChatTab`), не чат между людьми `[ПРЕДПОЛОЖЕНИЕ: для людского чата готовой сущности нет]`.
- **Поля-рендеры — реестра НЕТ, жёсткая тернарная цепочка:** `FieldDisplay.tsx:58,68-130` и `FieldInput.tsx:50,59-117`; контекст `FieldContext.ts:23-44` (в т.ч. `isForbidden` `:43`); гарды `.../record-field/ui/types/guards/`. Не найдено: `rg -n "registerField|fieldDefinitionRegistry|registerComponent" packages/twenty-front/src/modules` → 0. Новый тип отображения = правка `FieldDisplay` + `FieldInput` + гарда + `FieldMetadataType` (сервер + регенерация генерации) — т.е. **патч ядра**.
- **Действия — command menu данные-Driven:** элементы `FlatCommandMenuItem` (`.../metadata-store/types/FlatCommandMenuItem.ts`), серверная сущность `CommandMenuItemEntity` (`application.entity.ts:273`); привязка ключа к коду — закрытая карта `ENGINE_COMPONENT_KEY_COMPONENT_MAP` (`EngineComponentKeyHeadlessComponentMap.tsx:65`, использование `CommandRunner.tsx:30`, `useCommandMenuItemClick.ts:82`); ключи `EngineComponentKey` (`generated-metadata/graphql.ts:1951+`). App может добавить пункт через манифест (`application.dto.ts:121`, `compute-application-manifest-all-universal-flat-entity-maps.service.ts:644`). Открытого реестра действий НЕТ: не найдено `rg -n "registerAction|useRegisterCommand|commandMenu.*registry" packages/twenty-front/src/modules` → 0. Новое engine-действие = правка core; новое действие приложения = без правок.

### f) Тема

- Токены: `packages/twenty-ui/design-tokens/color/index.ts:1-24`, `font.ts:4-32` (`Inter`), `roundRadiusTokens.ts:1-6`; генератор `packages/twenty-ui/scripts/generateThemeTokens.ts` (`npx nx generateTokens twenty-ui`).
- Runtime-палитры: `THEME_LIGHT` (`packages/twenty-ui/src/theme/constants/ThemeLight.ts:5`), `THEME_DARK` (`ThemeDark.ts:6`), мост в CSS `themeCssVariables.ts:4`.
- CSS-переменные: `theme-light.css:4` (скоуп `.light`, переменные `--t-*`), тёмная — `theme-dark.css`; `ThemeProvider` вешает классы `light|dark` на `<html>` (`ThemeProvider.tsx:14-20`), сам провайдер `:22`; во фронте `BaseThemeProvider.tsx:19-35`.
- **Переопределение без правки компонентов — можно:** (1) проп `overrides?: Record<string,string|number>` / `theme` у провайдера (`ThemeProviderProps.ts:7-14`, `ThemeOverrides.ts:1`, scoped-режим `ThemeProvider.tsx:26-28`); (2) переопределение CSS-переменных `--t-*` внешней таблицей стилей.
- Linaria — только во фронте (`packages/twenty-front/package.json:47-48`, плагин `@wyw-in-js/vite` в `vite.config.ts:5,100`); **twenty-ui использует SCSS-модули** (106 файлов `*.module.scss`, напр. `StyledMenuItemBase.tsx:7`), linaria в `twenty-ui/package.json` не найдена.
- Не найдено `data-skin`/`html[data-...]`-скинов: `rg -n "data-skin|data-theme|html\[" packages/twenty-ui/src packages/twenty-front/src` → 0; не найдено `:root`/`--tw-` в css: `rg -n ":root" packages/twenty-ui/src --glob "*.css"` и `rg -n "\-\-tw-" packages/twenty-ui/src packages/twenty-front/src --glob "*.css"` → 0. Схема `html[data-skin]` не реализована, но эквивалентная по мощи точка — `ThemeProvider` + `overrides` + `--t-*` (см. выше).

### g) Права

- Роль: `role.entity.ts:23` (schema metadata), флаги `canReadAllObjectRecords`/`canUpdateAllObjectRecords`/`canDestroyAllObjectRecords` и др. (`:30-46`); флаги настроек `PermissionFlagType` (`packages/twenty-shared/src/constants/PermissionFlagType.ts:1-13`).
- Object-level: `object-permission.entity.ts` (`canReadObjectRecords`/`canUpdateObjectRecords`, конфиг `all-entity-properties-configuration-by-metadata-name.constant.ts:1536,1541`).
- Field-level: `field-permission.entity.ts` (`canReadFieldValue`/`canUpdateFieldValue`).
- Row-level: `row-level-permission-predicate.entity.ts:1` и `-group.entity.ts:1` — **оба `/* @license Enterprise */`**.
- Механика: настройки — `SettingsPermissionGuard` (`engine/guards/settings-permission.guard.ts:21-62`); CRUD — на уровне ORM `validateOperationIsPermittedOrThrow` (`permissions.utils.ts:47`, вызовы `workspace-repository.ts:1919,2122`), object-level `is-object-operation-permitted.util.ts:20-23`, field-level `permissions.utils.ts:116-135,242,283`, row-level — SQL-фильтры (`build-row-level-permission-record-filter.util.ts`, `render-row-level-permission-filter-to-sql.util.ts`, `build-row-access-policy.util.ts:49`). Кэш прав: `workspace-roles-permissions-cache.service.ts:168-224`.
- Free vs Enterprise: роли/object/field-permissions — без Enterprise-заголовка (core); RLS гейтится тарифом `hasValidEnterprisePlan && hasEntitlement(RLS)` (`row-level-permission-predicate.service.ts:490-499`), ключи entitlements `SSO, CUSTOM_DOMAIN, RLS, RECORD_SHARING, AUDIT_LOGS, USAGE_LIMIT` (`billing-entitlement-key.enum.ts:3-10`).
- Не найдено отдельных модулей `core-modules/authorization` и `modules/permission`: `ls packages/twenty-server/src/engine/core-modules | rg authorization; ls packages/twenty-server/src/modules/permission` → пусто (права живут в `metadata-modules/{role,object-permission,permissions,...}` + `engine/guards/*`).

---

## 2. ЗАДАЧИ (task)

### 2.1 Схема

- Объект `task`: `create-standard-flat-object-metadata.util.ts:1401-1434` (`nameSingular:'task'`, label = `title`); `taskTarget`: `:1436-1478` (`isSystem: true`). UUID: `standard-object-universal-identifiers.constant.ts:26` (`20202020-1ba1-48ba-bc83-ef7e5990ed10`). Поля (shared): `standard-object-fields.constant.ts:1376-1435`. Workspace-entity: `task.workspace-entity.ts:10-24`, `task-target.workspace-entity.ts:9-19` (цели: person/company/opportunity/custom — **задача не может быть целью задачи**).

| Поле | isNullable (где) | Примечание |
|---|---|---|
| `title` (не `name`) | true (`compute-task-standard-flat-field-metadata.util.ts:173`) | labelIdentifier |
| `bodyV2` | true (`:193`) | RICH_TEXT (blocknote+markdown) |
| `dueAt` | **true** (`:213`) | дедлайн есть, но необязателен |
| `status` | true (`:233`) | SELECT TODO/IN_PROGRESS/DONE, default TODO |
| `assignee` | **true** (`:428`), `onDelete: SET_NULL` | единственный «исполнитель» |
| `taskTargets` | true (`:369`) | relation на taskTarget |
| `attachments`, `timelineActivities` | true (`:402`, `:462`) | |
| системные (`id`, `createdAt`, ...) | false (`:42,:65,:94,:152,:288,:318`) | |

**Обязательность поля:** `isNullable: false` — штатный механизм на 5 уровнях: (1) задание в field metadata (`...:42`, `field-metadata.dto.ts:112`); (2) валидация метаданных — «Default value cannot be null for non-nullable fields» (`flat-field-metadata-validator.service.ts:235-245`); (3) GraphQL non-null (`compute-field-input-type-options.util.ts:12` → `apply-type-options-for-create-input.util.ts:30-32`); (4) Postgres `SET NOT NULL` с предварительным backfill'ом `UPDATE ... WHERE col IS NULL` (`update-field-action-handler.service.ts:263-274,624-644`, `workspace-schema-column-manager.service.ts:126-139`); (5) JSON-schema `required` для AI-инструментов (`record-properties.json-schema.ts:181,199,208`).

**Условная обязательность (required-if-status): не найдено.** `rg -n "isRequired|conditionalRequired|conditional" packages/twenty-server/src/engine/metadata-modules/flat-field-metadata packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/field-metadata packages/twenty-server/src/engine/metadata-modules/field-metadata` → 1 hit — тест-фикстура `compute-column-name.spec.ts:16`; `isRequired` есть только у `applicationVariable` (`all-entity-properties-configuration-by-metadata-name.constant.ts:1832,1863`). Не найдено переключателя «Required» в Settings: `rg -n "\`Required\`" packages/twenty-front/src -g '*.tsx'` → 1 hit — AI tool params (`SettingsToolParameterTable.tsx:115`).

### 2.2 Карточка и табы

Цепочка рендера — §1e (`RecordShowPage.tsx:21 → ... → WidgetContentRenderer.tsx:30`). Правой панели RightDrawer больше нет: `rg -ln "RightDrawer" packages/twenty-front/src -g '*.ts*'` → пусто (заменой — side-panel + command menu, `RecordShowPageShell.tsx:90,111`).

- У карточки **task стандартно 2 вкладки**: `home` и `note` (`standard-task-page-layout.config.ts:20-63`, зарегистрирован `standard-page-layout.constant.ts:53`) — НЕТ табов Timeline/Notes/Tasks/Files (те — у person/company, `standard-person-page-layout.config.ts:18-147`).
- **Где добавить вкладку «Чат»:** см. §1e (варианты A/B/C). Точка правки в форке — `standard-task-page-layout.config.ts:20`; без правок — режим кастомизации + `WidgetType.FRONT_COMPONENT`. Готовый `WidgetType.CHAT` — AI-чат записи (`ChatWidget.tsx:20-40`).
- Фильтрация табов по relation-полям: `getTabsRenderableForTargetObject.ts:33-52`, `WidgetTypeToRelationFieldName.ts:6-15`, `WidgetTypesRequiringRelationField.ts:5-10`.

### 2.3 Что есть из коробки

| Возможность | Вердикт | Доказательство / команда |
|---|---|---|
| Подзадачи (иерархия) | **нет** | полей parent/subtasks нет в `compute-task-standard-flat-field-metadata.util.ts` и `task.workspace-entity.ts:10-24`; `rg -ni "subtask\|parentTask\|parent_task" packages/twenty-server/src packages/twenty-front/src packages/twenty-shared/src` → пусто |
| Чек-листы | **частично** (только блок внутри rich-text) | блок `checkListItem` в BlockNote: `BlockEditor.tsx:68`, `DashboardBlockSchema.ts:9`, markdown-конвертация `convert-markdown-to-blocknote-blocks.util.ts:115`; отдельного объекта checklist нет — `rg -n "checklist" packages/twenty-server/src packages/twenty-front/src -i` → только CSS/типы/сиды |
| Наблюдатели/watches | **нет** | `rg -ni "watcher\|follower\|subscriber" .../compute-task-standard-flat-field-metadata.util.ts .../task/standard-objects` → пусто; есть только `assignee` (`:414`); близкий механизм — record-share (ACL) `packages/twenty-server/src/engine/core-modules/record-share/resolvers/record-sharing.resolver.ts:40` |
| Повторяемость/recurrence | **нет** | `rg -ni "rrule\|recurr\|repeatEvery\|repetition" packages/twenty-server/src/modules/task packages/twenty-front/src/modules/activities/tasks` → 1 hit — поле calendarEvent `recurringEventExternalId` (`standard-object-fields.constant.ts:563`); `rg -ni "rrule" packages/twenty-server/src packages/twenty-front/src` → пусто |
| Дедлайны | **есть** | `dueAt` (`:200`, isNullable `:213`), вью `allTasks` (`standard-object.constant.ts:1025-1036`), подсветка просрочки `TaskRow.tsx:138-143` |
| Напоминания/уведомления по задачам | **нет** | `ls packages/twenty-server/src/engine/core-modules \| rg -i "notif"` → пусто (нет модуля notification); `rg -n "reminder" packages/twenty-server/src -i \| rg -i "task\|due"` → пусто (только billing-reminders); cron с задачами — `rg -n "task" .../cron-register-all.command.ts -i` → пусто |

---

## 3. БИЗНЕС-ПРОЦЕССЫ (workflow)

### 3.1 Модель

- Workspace-сущности: `workflow.workspace-entity.ts:13-26` (`name`, `lastPublishedVersionId`, `statuses`, `versions`, `runs`, `automatedTriggers`, `attachments`); `workflow-version.workspace-entity.ts:9-28` (enum `DRAFT|ACTIVE|DEACTIVATED|ARCHIVED` `:10-14`, `trigger`/`steps` — flat-JSON `:18-19`); `workflow-run.workspace-entity.ts:18-74` (enum статусов `:18-26`, `state` `:64`, `stepLogs` `:65`, ссылки на версию `:68-73`); `workflow-automated-trigger.workspace-entity.ts:8-12`.
- Отдельной сущности `workflowRunStep` **нет** — шаги в jsonb `state.stepInfos` (`WorkflowRunStateStepInfos.ts:9-18`) и `stepLogs` (`WorkflowRunStepLog.ts:3-6`); миграция добавления `stepLogs` — `upgrade-version-command/2-9/2-9-workflow-command-1799000035000-add-workflow-run-step-logs-field.command.ts`.
- Core-entities (схема `core`): `workflow.entity.ts:25-81`, `workflow-version.entity.ts:26-71` (уникальный индекс «одна ACTIVE-версия» `:32-38`).
- **Версионирование живых экземпляров — факт:** при старте run версия копируется в снапшот `state.flow = {trigger, steps}` (`workflow-run.workspace-service.ts:604-629`, вызов `:111`), исполнение читает только снапшот (`run-workflow.job.ts:142-143`) — запущенные run'ы продолжают свою версию даже после редактирования/публикации workflow. Публикация `activateWorkflowVersion` (`workflow-trigger.workspace-service.ts:98`, старая ACTIVE → DEACTIVATED `:325-394`); редактирование всегда в DRAFT (`workflow-version.workspace-service.ts:46,97,147,307`).

### 3.2 Триггеры

Enum `DATABASE_EVENT | MANUAL | CRON | WEBHOOK` (`workflow-trigger.type.ts:9-14`) — **email-триггера нет**. Manual c `availability: Global|SingleRecord|BulkRecords` (`:38-49`); Cron `DAYS|HOURS|MINUTES|CUSTOM` (`:51-72`, паттерн `compute-cron-pattern-from-schedule.ts`); Webhook GET/POST + API_KEY (`:74-89`, контроллер `workflow-trigger.controller.ts:36,50,64` — `POST /webhooks/workflows/:workspaceId/:workflowId`); Database-event с фильтрами и списком полей (`automated-trigger-settings.ts:4-31`, listener `workflow-database-event-trigger.listener.ts:17`).

### 3.3 Шаги (22 типа, enum `packages/twenty-shared/src/workflow/types/WorkflowActionType.ts:1-24`; фабрика `workflow-action.factory.ts:62-106`; библиотека UI `packages/twenty-front/src/modules/workflow/workflow-steps/workflow-actions/constants/{CoreActions,FlowActions,HumanInputActions,RecordActions,AiActions}.ts`)

| Тип | Что делает (якорь) |
|---|---|
| `CODE` | исполнение JS/TS (`.../workflow-actions/code/`) |
| `LOGIC_FUNCTION` | вызов logic-функции приложения (`.../logic-function/`) |
| `SEND_EMAIL` / `DRAFT_EMAIL` | письмо / черновик (`.../mail-sender/`) |
| `SEND_CHAT_MESSAGE` | сообщение в Inbox (`.../send-chat-message/`) |
| `CREATE_CALENDAR_EVENT` | событие календаря |
| `CREATE/UPDATE/DELETE/UPSERT/FIND_RECORDS/PICK_RECORD` | CRUD записей (`.../record-crud/`) |
| `FORM` | **пауза до заполнения формы человеком** (`form.workflow-action.ts:32` → `{wait:{type:'CALLBACK'}}`) |
| `FILTER` | условие-фильтр ветки |
| `IF_ELSE` | ветвление (`if-else.workflow-action.ts:33-60`) |
| `ITERATOR` | цикл по массиву (`iterator.workflow-action.ts:47-128`) |
| `HTTP_REQUEST` | вызов внешнего API |
| `AI_AGENT` | LLM-агент с инструментами и human-input |
| `CLASSIFY` | классификация значения |
| `DELAY` | ожидание даты/длительности (`delay.workflow-action.ts:34-88`) |
| `WAIT_FOR_EVENT` | ожидание события TIME/EVENT |
| `EMPTY` | заглушка |

### 3.4 Человеческие шаги, таймеры, SLA, параллельность, откат

- **Ожидание человека — есть (2 механизма):** шаг `FORM` (`form.workflow-action.ts:32`; отправка ответа `submitFormStep` — `workflow-version-step.resolver.ts:227-249` → `workflow-runner.workspace-service.ts:109`; UI `useSubmitFormStep.ts`, `WorkflowFormStepSubmitButton.tsx`) и AI-agent human-input (`workflow-agent-human-input-prompt.constant.ts:1` — `ask_question`, `request_form`, `propose_tool_call`; pausing-tools `.../ai-agent-execution/pausing-tools/*.pausing-tool.ts`).
- **Классического approval-шага с исполнителем-человеком и статусами approve/reject — нет:** `rg -ni "approval|approve" packages/twenty-server/src/modules/workflow -g '*.ts'` → только AI-prompt и chat-message.
- **Таймеры — есть:** `DELAY` (`delay.workflow-action.ts:75-88`), `WAIT_FOR_EVENT`, схема условий `pending-wake-up-condition-schema.ts:4-14`, механика подъёма `workflow-step-wait.workspace-service.ts:15-32`.
- **SLA/эскалации — не найдено:** `rg -ni "\bSLA\b|escalat" packages/twenty-server/src/modules/workflow -g '*.ts'` → пусто.
- **Параллельные ветки — есть:** `Promise.all` по `nextStepIds` (`workflow-executor.workspace-service.ts:92-101`), join-семантика «все родители завершены» (`should-execute-child-step.util.ts:29-41`), выбор веток (`get-effective-parent-status.util.ts:26-35`), UI-тест параллельных рёбер (`separateParallelWorkflowEdges.test.ts`).
- **Откат/возврат на шаг — не найдено:** `rg -n "rollback" packages/twenty-server/src/modules/workflow -g '*.ts'` → пусто. Есть retry (`errorHandlingOptions.retryOnFailure/continueOnFailure` — `workflow-action-settings.type.ts:26-31`, `get-step-configured-retry-count.util.ts:4`), ручной повтор `retryWorkflowRun` (`workflow-trigger.resolver.ts:194-195`), остановка `stopWorkflowRun` (`workflow-runner.workspace-service.ts:252`).
- **Журнал выполнения — есть:** jsonb `stepLogs` (cap 256 КБ — `workflow-run-step-log.workspace-service.ts:25-60`, схема `workflow-run-step-log-schema.ts:6-60`), UI `WorkflowRunStepLogsDetail.tsx`, `useWorkflowRunStepLog.ts:15-23`, боковая панель `SidePanelWorkflowRunViewStepContent.tsx:18,183`.
- **Запуск из карточки:** для MANUAL-триггера автоматически создаётся command-menu-item с привязкой к объекту (`createOrUpdateCommandMenuItem` — `workflow-trigger.workspace-service.ts:539-596`, `availabilityObjectMetadataId` `:545`), на фронте `TriggerWorkflowVersionEngineCommand.tsx:41-82` (⌘K/pinned; отдельной кнопки «Start workflow» в шапке нет). Запуск по событию/cron/API — см. §3.2.

### 3.5 Таблица «Битрикс24 BP ↔ Twenty workflow»

| Пункт Битрикс24 | Twenty | Вердикт | Основание (path:line) | Чем закрыть |
|---|---|---|---|---|
| Последовательный процесс | граф шагов `workflowVersion.steps` | **есть** | `run-workflow.job.ts:167-174`; `workflow-version.workspace-entity.ts:19` | — |
| Параллельный процесс | `Promise.all` + join | **есть** | `workflow-executor.workspace-service.ts:92-101`, `should-execute-child-step.util.ts:29-41` | — |
| Шаг «Задание/согласование» | только FORM (заполнение) + AI approve/reject | **частично** | `form.workflow-action.ts:32`, `workflow-version-step.resolver.ts:227`, `propose-tool-call.pausing-tool.ts` | свой шаг/шаг-обёртка: assignee + статусы = патч ядра workflow-executor либо эмуляция через FORM + object-task |
| Роли и делегирование (исполнитель шага = роль/member) | нет — шаг в системном контексте | **нет** | `rg -ni "assignee\|delegat" packages/twenty-server/src/modules/workflow -g '*.ts'` → только тесты record-assignee; `buildSystemAuthContext` (`workflow-run.workspace-service.ts:79`); `workflow-action-settings.type.ts:24-33` без исполнителя | патч ядра (настройки шага + resolve исполнителя) либо внешний сервис |
| Условия | `IF_ELSE`, `FILTER` | **есть** | `if-else.workflow-action.ts:33-60`, `filter/` | — |
| Шаблоны процессов | нет (только `duplicateWorkflow`) | **нет** | `rg -ni "template" packages/twenty-server/src/modules/workflow -g '*.ts'` → только email-шаблоны; `duplicateWorkflow.ts` | app/seed с workflows в манифесте |
| Запуск вручную из карточки | command menu записи | **есть** | `workflow-trigger.workspace-service.ts:539-596`, `TriggerWorkflowVersionEngineCommand.tsx:41-82` | — |
| Запуск по событию | database/cron/webhook триггеры | **есть** | `workflow-database-event-trigger.listener.ts:17`, `automated-trigger-settings.ts:4-31` | — |
| Журнал выполнения | `stepLogs` + UI | **есть** | `workflow-run.workspace-entity.ts:65`, `workflow-run-step-log.workspace-service.ts:25-60` | — |
| Таймеры | `DELAY`, `WAIT_FOR_EVENT` | **есть** | `delay.workflow-action.ts:75-88`, `pending-wake-up-condition-schema.ts:4-14` | — |
| SLA/эскалации | нет | **нет** | `rg -ni "\bSLA\b\|escalat" packages/twenty-server/src/modules/workflow -g '*.ts'` → пусто | патч ядра (таймер + уведомления) — но в ядре нет и модуля notification (§2.3) |
| Откат на шаг | нет (есть retry/stop) | **частично** | `rg -n "rollback" packages/twenty-server/src/modules/workflow -g '*.ts'` → пусто; `retryWorkflowRun` (`workflow-trigger.resolver.ts:194`) | патч ядра |
| Документы процесса | только `attachments` у workflow и вложения в письме | **частично** | `workflow.workspace-entity.ts:23`, `resolve-email-files.util.ts:25-35` | app: relation + виджет |
| Email-триггер | нет (enum только 4 типа) | **нет** | `workflow-trigger.type.ts:9-14` | патч ядра или входящая почта → HTTP-роут logic function |

---

## 4. СООБЩЕНИЯ

### 4.1 Email / календарь (штатно)

- Модуль `packages/twenty-server/src/modules/messaging/` (managers: import/outbound/folder/participant/cleaner/blocklist) + объекты `message`, `message-thread` (`message-thread.workspace-entity.ts:7-9`), `message-participant` (маппинг на person/workspaceMember — `:11-21`), `message-channel-message-association`, `message-folder`.
- Провайдеры (`ConnectedAccountProvider.ts:1-9`): `google`, `microsoft`, `imap_smtp_caldav`, `oidc`, `saml`, `email_group`, `app`. OAuth-ключи: Google (`config-variables.ts:185,194`), Microsoft (`:285,294`); IMAP/SMTP/CalDAV — core-модуль `imap-smtp-caldav-connection/`, форма `useImapSmtpCaldavConnectionForm.ts`.
- Флаги по умолчанию: `CALENDAR_PROVIDER_GOOGLE_ENABLED=false` (`config-variables.ts:160`), `MESSAGING_PROVIDER_GMAIL_ENABLED=false` (`:211`), **`IS_IMAP_SMTP_CALDAV_ENABLED=true` (`:251`)**, `MESSAGING_PROVIDER_MICROSOFT_ENABLED=false` (`:332`), `CALENDAR_PROVIDER_MICROSOFT_ENABLED=false` (`:349`).
- Импорт: драйверы `message-import-manager/drivers/{gmail,imap,microsoft,smtp,inbound-email}`, cron `messaging-messages-import.cron.job.ts`; отправка: `send-email.resolver.ts:57`; календарь: `calendar-event.workspace-entity.ts:10-28`, импорт-драйверы `drivers/{caldav,google-calendar,microsoft-calendar}`, cron `calendar-events-import.cron.job.ts`.
- **APP-канал** (сообщения от приложений): `MessageChannelType.APP` (`application-message-channels.service.ts:109,146`), ingestion `application-message-ingestion.resolver.ts:42-43` (`ingestAppMessages`), SDK-обёртка `packages/twenty-sdk/src/sdk/logic-function/messaging/ingest-messages.ts:21`.
- `[ПРЕДПОЛОЖЕНИЕ]` из коробки без ключей работает IMAP/SMTP/CalDAV (включён по умолчанию) и APP-каналы; Google/Microsoft требуют OAuth-ключей и по умолчанию выключены.

### 4.2 Внутренние чаты / комментарии

**Вердикт: НЕТ.** Доказательства (точные команды):
- `rg -il "chat|direct.?message|dm\b|comment" packages/twenty-server/src/modules packages/twenty-front/src/modules` → только `modules/ai/*` (AI-чат), `modules/support/*` (сторонний Front App — `useInstantiateSupportChat.ts:48,82`), «comment» как обычное поле записей.
- `rg --files packages/twenty-server/src packages/twenty-front/src | rg -i "comment|messenger"` → **не найдено** (пусто).
- `rg -n "\bComment\b|'COMMENT'" packages/twenty-server/src --glob '!**/*.spec.ts'` → только i18n-переводы и python-скрипты.
- `ls packages/twenty-server/src/modules/{note,task,timeline}` → только `query-hooks`, `standard-objects`, `timeline-activity` — без веток обсуждений.

### 4.3 Notes (BlockNote) как основа обсуждений

- Движок: `@blocknote/mantine|react|xl-pdf-exporter ^0.51.4` (`packages/twenty-front/package.json:33-35`), серверная конвертация `@blocknote/server-util` (`transform-rich-text.util.ts:8,44-83`).
- Хранение: композит `RICH_TEXT` с подполями `blocknote` + `markdown` (`rich-text.composite-type.ts:4-29`); у note — `note.workspace-entity.ts:12` (`bodyV2`), тип поля `compute-note-standard-flat-field-metadata.util.ts:179-184`.
- Редактор/рендер: `ActivityRichTextEditor.tsx:63-76,130`, `NoteTile.tsx:79`, виджет `NoteWidget.tsx:1`, упоминания `modules/mention/` (`useWorkspaceMemberMentionSearch.ts`, `MentionInlineContent.tsx`).
- Real-time записей (включая note) — SSE из §1d (`event-stream.resolver.ts:67,75`, `useListenToEventsForQuery.ts`).
- **Чего нет для чата:** тредов/ответов (у Note только `title, bodyV2, createdBy, updatedBy, noteTargets, attachments, timelineActivities` — `note.workspace-entity.ts:9-19`), сущностей «комната/участники/unread» (не найдено — команда `rg --files ... | rg -i "comment|messenger"` → пусто), уведомлений об упоминаниях (§4.4), пер-символьной синхронизации (сохранение whole-document → конфликт «последний победил» `[ПРЕДПОЛОЖЕНИЕ]`).
- **Итог:** notes — хорошая основа для «обсуждения записи» (текст, файлы, @упоминания, SSE), но чат/DM требует до-стройки тредов/комнат/unread/уведомлений.

### 4.4 Уведомления

**Модуля уведомлений НЕТ:** `rg --files packages/twenty-server/src packages/twenty-front/src | rg -i "notification"` → только webhook-хендлеры провайдеров и сид-компонент; `ls packages/twenty-server/src/engine/core-modules | rg -i "notif"` → пусто; стандартного объекта notification нет (`rg -il "notification" .../twenty-standard-application .../workspace-migration/constant` → пусто). Вместо: тосты (`AppToaster.tsx`), snackbar для front-components (`useFrontComponentExecutionContext.ts`), inbox/unread только у AI-чата (`agentChatThreadInboxStatusFamilySelector.ts`).

---

## 5. МУЛЬТИТЕНАНТНОСТЬ И НАДЁЖНОСТЬ (контрольный список)

| Пункт | Статус | Доказательство |
|---|---|---|
| Схема на workspace | **да (данные)** — `workspace_${uuidToBase36(workspaceId)}` | `get-workspace-schema-name.util.ts:3-5`; DDL `workspace-schema.service.ts:37-45`; колонка `workspace.databaseSchema` `workspace.entity.ts:270-272`; вызов `workspace-manager.service.ts:47-59` |
| Metadata — общий слой | **смешанная модель**: metadata-таблицы в общей схеме `core` с `workspaceId`, строки данных — per-workspace schema | `core.datasource.ts:44-56`; уникальность `(nameSingular, workspaceId)` `object-metadata.entity.ts:45-53`; setup схем `public`/`core` `setup-db.ts:9-14` |
| Контекст workspace в запросах (AsyncLocalStorage) | **да, 2 уровня** | auth-context `workspace-auth-context.storage.ts:5-23` (бросает при отсутствии `:12-15`); ORM-context `orm-workspace-context.storage.ts:35-57`; резолв JWT→workspace `jwt.auth.strategy.ts:429-469`; middleware `app.module.ts:111-118,137-141`, `workspace-auth-context.middleware.ts:24-32,74-78` |
| Контекст в job/очередях | **явная передача workspaceId** | `bullmq.driver.ts:268-271`, `message-queue.explorer.ts:193,227-234`; построение системного контекста `buildSystemAuthContext` — `messaging-blocklist-item-delete-messages.job.ts:47-51,94-96`, `build-system-auth-context.util.ts:6-13` |
| Места БЕЗ контекста | **зафиксированы кодом** | входящие webhook'и: `PublicEndpointGuard` всегда `true` (`public-endpoint.guard.ts:11-13`, применение `messaging-webhooks.controller.ts:36`); workflow-webhook берёт workspace из URL (`workflow-trigger.controller.ts:49-53,83-102`); cron: «runs in a cron with no workspace context» (`pending-file-cleanup.service.ts:27`), «Queue workers get no async-local auth context» (`with-resolved-tool-auth-context.util.ts:8`); обход — перебор workspace + `buildSystemAuthContext` (`workflow-run-enqueue.cron.job.ts:54`, `messaging-...-monitoring.cron.job.ts:52,76`) |
| Кэш метаданных | **есть, многоуровневый** | TTL metadata-version/typeDefs 7d (`workspace-cache-storage.service.ts:35,42-51`); in-process `LOCAL_TTL_MS=100`/`MEMOIZER=10s`/`LOCAL_ENTRY=30min` + Redis `CACHE_STORAGE_TTL=7d` (`workspace-cache.service.ts:63-70,501,757`, `config-variables.ts:1469`); инвалидация инкрементом `metadataVersion` после миграций (`workspace-metadata-version.service.ts:26-49`, `workspace-migration-runner.service.ts:111`), точечно `invalidateAndRecompute` (`workspace-cache.service.ts:420-432`) |
| Лимиты | **есть** | API 100 req/s per apiKey и 500/min per application (`usage-limit-definitions.constant.ts:18-56`); email-квоты (`:153-180,219-229`); webhook (`:241-256`); storage 100 GiB / records 10M (`config-variables.ts:719,729`); body 100MB (`engine/constants/settings/index.ts:10`, `main.ts:78-98`); токен-бакет в Redis (`throttler.service.ts:25,45-60`); `MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY=5` (`max-workspaces-without-organization-key.constants.ts:1`, применение `sign-in-up.service.ts:537`); `MAX_SEATS_WITHOUT_ENTERPRISE_KEY=25` (`max-seats-without-organization-key.constant.ts:6`). Лимита «максимум участников workspace» — **не найдено**: `rg -ni "MAX_WORKSPACE_MEMBERS\|WORKSPACE_MEMBER_LIMIT\|memberLimit" packages/twenty-server/src` → 0 |

`[ПРЕДПОЛОЖЕНИЕ]` публичный workflow-webhook (`workflow-trigger.controller.ts:49-53` под `PublicEndpointGuard`) защищён фактически только незнанием UUID — отдельной подписи/секрета в этом контроллере не обнаружено.

---

## 6. ЛИЦЕНЗИЯ (только факты, без юридических выводов)

### 6.1 `@license Enterprise`

- `rg -l "@license Enterprise" packages` → **482 файла**. По пакетам: `twenty-server` 421, `twenty-front` 56, `twenty-shared` 5.
- По каталогам 2-го уровня (основные): `twenty-server/src/engine/core-modules` 367, `twenty-front/src/modules/settings` 47, `twenty-server/src/engine/metadata-modules` 25, `twenty-server/src/engine/workspace-manager` 12, `twenty-server/src/engine/twenty-orm` 8, `twenty-server/test/integration/graphql` 7, `twenty-shared/src/types` 5.
- Детализация core-modules (367): `billing` 166, `record-share` 71, `usage` 27, `billing-webhook` 22, `enterprise` 19, `sso` 18, `event-logs` 15, `auth` 10, `usage-limit` 5, `jwt` 4, `emailing-domain` 4, `admin-panel` 3, `cloudflare` 2, `dns-manager` 1.
- Формулировка всегда идентична — одна строка `/* @license Enterprise */` (`rg -o "@license Enterprise[^\n]*" packages | sort | uniq -c` → ровно 482 одинаковых), примеры: `packages/twenty-server/src/engine/core-modules/enterprise/services/enterprise-plan.service.ts:1`, `packages/twenty-front/src/modules/object-record/record-field/ui/meta-types/utils/getRestrictingRowLevelPermissionPredicates.ts:1`.
- Корневой `LICENSE:4-5` цитирует: «Certain files are licensed under a commercial license. These files are clearly marked with the following comment at the top of the file: /* @license Enterprise */», «Files with this comment are not licensed under the AGPLv3, but instead are subject to the commercial license terms defined at the end of this file.»; первая содержательная строка `LICENSE:2` — «This project is mostly licensed under the GNU Affero General Public License v3.0 (AGPLv3) as described below, with two qualifications:».

### 6.2 Что реально закрыто `EnterpriseFeaturesEnabledGuard`

- Guard проверяет validity-токен: `enterprise-features-enabled.guard.ts:25-29` → `enterprisePlanService.isValidWithFreshToken()` (`enterprise-plan.service.ts:202-217`); токен — `AppTokenEntity` типа `EnterpriseValidityToken` (`:97-102`) либо конфиг `ENTERPRISE_VALIDITY_TOKEN` (`:114`), проверка подписи RSA-SHA256 по `ENTERPRISE_JWT_PUBLIC_KEY` (`:746-789`); `ENTERPRISE_KEY` участвует в `refreshKeyPayload()` (`:74-88`) и валидации на `ENTERPRISE_API_URL/validate` (`:311-336`) `[ПРЕДПОЛОЖЕНИЕ по эндпоинтам]`.
- **Usage sites — только 2 файла** (`rg -n "EnterpriseFeaturesEnabledGuard" packages`): `sso-auth.controller.ts` — 5 эндпоинтов SSO/SAML/OIDC (`:64-69,:85-90,:96-101,:107-112,:118-123` с guard на `:66,:87,:98,:109,:120`) и `sso.resolver.ts:40-54` — guard на всём классе (create/get/delete/edit OIDC и SAML провайдеров `:59-98`). **Итого этим guard'ом закрыт только SSO.**
- AuditLog guard'ом НЕ закрывается: `rg -l "@license Enterprise" packages | grep -i audit` → пусто.
- Прочие `@license Enterprise`-зоны проверяются иначе (не через этот guard): RLS — `row-level-permission-predicate.service.ts:490-499` (`isValid() && hasEntitlement(RLS)`), лимиты мест — `custom-ai-provider-access.service.ts:43`, `admin-panel-ai-provider.service.ts:47`, лимит воркспейсов — `sign-in-up.service.ts:537`, billing — `billing-subscription.service.ts:231,265`, event-logs — `event-logs.service.ts:190`, ротация ключей — `rotate-signing-keys.cron.job.ts:29`, email-group — `email-group-access.service.ts:35`, GraphQL-экспозиция статуса — `workspace.resolver.ts:384-390`.
- Переменных `IS_ENTERPRISE`/`ENTERPRISE_LICENSE`/`licenseKey` в коде нет: `rg -n "IS_ENTERPRISE\|ENTERPRISE_LICENSE\|licenseKey" packages/twenty-server/src` → 0. Объявления конфига: `ENTERPRISE_KEY` (`config-variables.ts:2234`), `ENTERPRISE_VALIDITY_TOKEN` (`:2244`).

### 6.3 Лицензионные файлы и package.json

- `find packages -maxdepth 2 -name LICENSE` → 6 файлов, первая строка каждого — `MIT License` / `Copyright (c) 2023-present Twenty.com, PBC`: `packages/create-twenty-app/LICENSE:1`, `packages/twenty-cli/LICENSE:1`, `packages/twenty-client-sdk/LICENSE:1`, `packages/twenty-sdk/LICENSE:1`, `packages/twenty-shared/LICENSE:1`, `packages/twenty-ui/LICENSE:1`. LICENSE-файла **нет** у `twenty-front`, `twenty-server`, `twenty-docs`, `twenty-emails`, `twenty-zapier` и др.
- Поле `license` в package.json: корневой — `AGPL-3.0` (`package.json:26`); `AGPL-3.0`: twenty-server, twenty-agent-skills, twenty-claude-skills, twenty-companion, twenty-docs, twenty-e2e-testing, twenty-emails, twenty-front-component-renderer; `MIT`: twenty-cli (`twenty`), twenty-client-sdk, twenty-sdk, twenty-shared, twenty-ui, create-twenty-app; **поле отсутствует**: twenty-front, twenty-oxlint-rules, twenty-utils, twenty-website, twenty-zapier.

---

## 7. ИТОГ

### 7.1 Таблица «Требование ↔ чем закрыть»

| # | Требование (Битрикс24-ориентир) | Чем закрыть | Механизм | Оценка | Риск обновления upstream |
|---|---|---|---|---|---|
| 1 | Визуальная надстройка (бренд-цвета/радиусы/шрифты) | `ThemeProvider` с `overrides` + CSS-переменные `--t-*` (`ThemeProvider.tsx:14-28`, `ThemeProviderProps.ts:7-14`, `theme-light.css:4`); Linaria-токены своего слоя во фронте | **штатный** | S | **низкий** (churn twenty-ui/theme: 15+6 коммитов/6 мес) |
| 2 | Обязательные поля по статусам (условная обязательность) | Глобально — `isNullable:false` (штатно, 5 уровней §2.1); условно — PRE-hook `@WorkspaceQueryHook('task.updateOne')` в модуле хуков (`task-query-hook.module.ts:9-19`) | **штатный** (глобально) / **расширение app-слоя сервера** (условно — правка модуля `modules/task/query-hooks` в форке) | S–M | **низкий** (churn query-hook: 9, task: 8 коммитов) |
| 3 | Чат в задаче (вкладка «Чат») | Данные-Driven таб: запись `pageLayoutTab` + виджет; свои сообщения — front-component виджет через `WidgetType.FRONT_COMPONENT` (`FrontComponentWidgetRenderer.tsx:27`) — без правки ядра; либо правка `standard-task-page-layout.config.ts:20` в форке. Людской чат (треды/unread) — **новая сущность** поверх notes/SSE (§4.3) | **расширение (app)** / правка стандартного конфига = **патч ядра** | M (L с тредами/unread) | **средний/высокий** (churn page-layout: 257+206 коммитов) |
| 4 | Процессы с шагами-заданиями (согласование, исполнитель, роли) | Граф/параллельность/таймеры/FORM — штатно (§3); шаг с assignee-человеком, SLA, откат — **только патч ядра** workflow-executor/actions (или эмуляция FORM + задачи) | **штатный (частично)** → **патч ядра** | L | **высокий** (churn workflow: 256+137+206 коммитов/6 мес) |
| 5 | Включение модулей по workspace | Twenty Apps: per-workspace install/uninstall/upgrade через `installApplication` + манифест (§1a) | **штатный** | M | **средний** (churn application: 356 коммитов — самая активная зона) |
| 6 | Интеграция с Битрикс24 (обмен данными) | Исходящие вебхуки (HMAC, §1d) + `HTTP_REQUEST`-шаги workflow + `httpRouteTriggerSettings`/HTTP-триггеры logic functions = исходящий поток; входящего универсального webhook-endpoint нет — **новый сервис** (HTTP-роут-шлюз) либо webhook-роуты logic functions | **штатный (исходящее)** / **новый сервис (входящее)** | M | **низкий** (webhook-слой и HTTP-роуты стабильны; churn `engine/subscriptions` 68) |
| 7 | (бонус) Обязательные поля/новые типы полей в UI | Новый тип отображения поля = правка `FieldDisplay.tsx:58` + `FieldInput.tsx:50` + гарда + генерация | **патч ядра** | M | низкий (сами файлы: churn 0 за 6 мес, но вокруг 38) |

### 7.2 Топ-10 самых опасных мест для патчей

Критерий: число коммитов upstream за 6 месяцев (`git log --since="6 months ago" --oneline -- <путь> | wc -l`, репозиторий от 2026-10-08) — чем больше, тем чаще конфликты при rebasing форка.

| # | Путь | Коммитов/6 мес | Почему опасно |
|---|---|---|---|
| 1 | `packages/twenty-front/src/generated-metadata/graphql.ts` | 404 | генерируемый файл — патчи перезаписываются регенерацией |
| 2 | `packages/twenty-server/src/engine/core-modules/application` | 356 | самая активная зона (жизненный цикл apps), ядро установки модулей |
| 3 | `packages/twenty-front/src/modules/page-layout` | 257 | табы/виджеты карточек — точка расширения UI |
| 4 | `packages/twenty-server/src/modules/workflow` | 256 | движок процессов |
| 5 | `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application` | 223 | стандартные объекты/табы/конфиги — правки здесь ломаются при каждом обновлении шаблонов |
| 6 | `packages/twenty-front/src/modules/workflow` | 206 | UI процессов |
| 7 | `packages/twenty-server/src/modules/messaging` | 149 | почта/сообщения |
| 8 | `packages/twenty-front/src/modules/command-menu-item` | 148 | действия/запуск процессов из карточки |
| 9 | `packages/twenty-server/src/modules/workflow/workflow-executor` | 137 | исполнение шагов — место патча «задания-согласования» |
| 10 | `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts` | 96 | конфиг — любой форк-параметр придётся переносить вручную |

Рекомендация по стратегии: минимальный footprint патчей — в точках с churn ≤ 10 (`query-hook` 9, `task` 8, роутинг `createWorkspaceRouteObjects.tsx` 7, `FieldDisplay/FieldInput` 0); максимальный риск — зоны 1–9, поэтому функционал из §7.1 п. 3–5 по возможности выносить в app-манифест/отдельные сервисы, а не править core.

### 7.3 Ключевые ограничения базовой линии (кратко)

1. Нет внутреннего чата/комментариев и модуля уведомлений (§4.2, §4.4).
2. Нет условной обязательности полей, подзадач, recurrence, watchers, напоминаний у задач (§2).
3. Нет SLA/эскалаций, отката на шаг, approval-шага с исполнителем и шаблонов процессов (§3.4–3.5).
4. Реестров расширения UI нет (маршруты, поля-рендеры, действия) — расширение через данные (pageLayout/commandMenu/app-manifest), новые типы — только патч ядра (§1e).
5. Enterprise-гейт `EnterpriseFeaturesEnabledGuard` покрывает только SSO; основной массив `@license Enterprise` (billing, record-share, RLS, usage) закрыт иными проверками (§6).
6. dev-окружение на 16 ГБ работает только впритык (swap 10+ ГБ), для разработки нужно ≥32 ГБ (§0.3).
