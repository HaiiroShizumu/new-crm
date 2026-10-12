# ADR-007: Единый шов (smb-server / smb-front)

**Статус:** Предложено (утверждение за владельцем)
**Правка 2026-10-12:** прототип Discovery (п.«Риск») прогнан, место P-002 подтверждено — `docs/reports/S-A2.md`; серверная половина размещения закрыта на **M2** (решение владельца, TODO M-1).
**Дата:** 2026-10-09
**Основание:** `docs/arch/00-baseline-analysis.md` §1c, §1e, §1f; верификация на базе `twenty/v2.45.6` (`docs/arch/02-verification-at-base.md`); правило форка в `docs/PATCHES.md`
**Связанные:** [ADR-001](ADR-001-module-mechanism.md) (гибрид Apps + швы), [ADR-002](ADR-002-record-conversations.md) (права в шве), [ADR-003](ADR-003-business-processes.md) (хуки задач), [ADR-005](ADR-005-visual-layer.md) (brand.css)

---

## Контекст

Форк должен наращивать функциональность в `packages/smb-*` / `apps/`, а ядро Twenty трогать минимально и только по реестру `docs/PATCHES.md`. Если каждый модуль добавляет свой импорт в разные файлы ядра, реестр растёт и merge с upstream ломается в нескольких точках.

Нужна **одна** серверная и **одна** фронтовая точка входа в ядре («единый шов»): весь код форка подключается через эти два импорта.

Факты на базе `twenty/v2.45.6`:

- Хуки CRUD регистрируются Discovery по метаданным (`workspace-query-hook.explorer.ts:48-57` — `discoveryService.getProviders()` + фильтр `@WorkspaceQueryHook`), но **модуль с провайдером должен быть в дереве Nest-импортов**. Сейчас хук-модули импортируются в `workspace-query-hook.module.ts:19-28` (в т.ч. `TaskQueryHookModule` `:27`), а не в `modules.module.ts` (на базе там только Messaging/Calendar/ConnectedAccount/Onboarding/Workflow/WorkspaceMember).
- Yarn workspaces — явный список пакетов в корневом `package.json` (`workspaces.packages`), не glob `packages/*`.
- Docker-сборка (`packages/twenty-docker/twenty/Dockerfile`) копирует пакеты поимённо (`COPY ./packages/twenty-server …`, `twenty-front`, `twenty-shared`, …) — новый пакет без строки COPY в образ не попадёт.
- Nx: у каждого пакета свой `project.json`; зависимости — через `dependsOn: ["^build"]` и package.json `dependencies`.

## Варианты

### A. Много точечных швов в ядре

Каждый модуль сам правит `modules.module.ts`, роутинг, ThemeProvider и т.д. — много строк в `PATCHES.md`.

### B. Единый шов (два импорта в ядре)

- Сервер: `packages/smb-server` → `SmbServerModule`; в ядре **одна** строка-импорт (запись **P-002**), предпочтительно в `packages/twenty-server/src/modules/modules.module.ts` **или** в `workspace-query-hook.module.ts` — если шов нужен именно для Discovery хуков (см. риск ниже).
- Фронт (реализовано 2026-10-09, решение владельца): размещение **M2** — каталоги
  `packages/twenty-front/src/modules/smb-*`, а не пакет `packages/smb-front` (см. «Фронт» ниже).
  Шов = **одна строка** в `index.tsx` (**P-003**) + одна точка монтирования эффекта (**P-013**).

### C. Без швов ядра (только Apps)

Всё через манифест. Не покрывает серверные `@WorkspaceQueryHook`, ThemeProvider-провайдеры форка, brand.css в бандле фронта.

## Критерии

| Критерий | A: много швов | B: единый шов | C: только Apps |
|---|---|---|---|
| Строк в `PATCHES.md` на модуль | растёт линейно | **2 фиксированных** (P-002, P-003) + редкие исключения | 0 |
| Конфликты при merge upstream | высокие | низкие (два файла) | минимальные |
| Серверные CRUD-хуки | да | да (через SmbServerModule) | нет |
| Brand / провайдеры фронта | да | да (SmbFrontEntry) | частично (Remote DOM) |

## Решение (рекомендация)

**Вариант B — единый шов.**

### Сервер

```
packages/smb-server/
  project.json
  package.json
  src/
    smb-server.module.ts    # SmbServerModule — imports/providers всех smb-фич
    ...
```

В ядре (запись **P-002**): ровно один импорт `SmbServerModule` — в файл, который уже входит в дерево приложения. Кандидаты на базе:

1. `packages/twenty-server/src/modules/modules.module.ts` — общий шов доменных модулей;
2. `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/workspace-query-hook/workspace-query-hook.module.ts` — если Discovery хуков требует соседства с `WorkspaceQueryHookExplorer` (проверить прототипом ниже).

Весь код хуков/сервисов форка живёт в `smb-server`; ядро не знает имён фич.

### Фронт

**Размещение: M2 — каталоги, а не пакет** (решение владельца 2026-10-09, критерий — измерение «M1 против M2»):

```
packages/twenty-front/src/modules/
  smb-skin/        # перенесённый скин (82 файла из архива старого форка)
  smb-brand/
    brand.css      # бренд-слой ADR-005
```

Почему не `packages/smb-front` (M1) — по измерению на этой базе:

- скин импортирует **155 уникальных `@/…`** внутренностей twenty-front (navigation,
  object-record, settings, messenger), а twenty-front при этом должен зависеть от
  `smb-front` — получается **цикл**, который ломает границы Nx-модулей;
- M1 потребовал бы править **5–7 существующих файлов** (корневой `package.json` с явным
  списком `workspaces.packages`, `yarn.lock`, `twenty-front/package.json`, Dockerfile с 63
  поимёнными `COPY`) — это топ-зоны конфликтов при merge upstream;
- M2 требует **одного** правимого файла ядра плюс одну точку монтирования, а алиас
  `@/* → ./src/modules/*` и `~` делают 82 файла переносимыми **без единой правки импортов**.

Следствие: правило «наш код только в `packages/smb-*`» расширено на фронт —
в `scripts/check-core-patches.sh` добавлен паттерн
`^packages/twenty-front/src/modules/smb-[a-z0-9-]+/` (прошёл ревью владельца,
+3 bats-кейса, 15/15 зелёные). **Серверная половина не входит в этот паттерн** —
её размещение (M1 против M2) выбирается отдельно по A2 п.2.1.

Швы фронта в ядре (оба в `docs/PATCHES.md`):

| ID | Файл | Одна строка |
|---|---|---|
| **P-003** | `packages/twenty-front/src/index.tsx` | `import '@/smb-skin/styles/smb-skin.css';` — после импортов тем, чтобы бренд-слой/скин их переопределяли. Из этого файла `@import`-ом тянутся `smb-records.css` и `smb-brand/brand.css` |
| **P-013** | `modules/app/components/SharedAppProviders.tsx` | `<SmbSkinEntry />` внутри `<BaseThemeProvider>` — эффекту нужны jotai-атомы (а `JotaiProvider` живёт в `App.tsx` выше по дереву) и срабатывание раньше snapshot'а `ThemeProvider` |

Второй шов допущен решением владельца от 2026-10-09 («если нужна правка второго файла,
отдельный шов с записью»). Подмена скелетонов и TopBar правками ядра в Этапе 2 **не
делается** — компоненты, зависящие от которых нет в v2.45.6 (12 файлов: messenger,
ui-preferences, форковые navigation), в перенос не вошли.

### Как пакеты подключаются

| Слой | Что добавить |
|---|---|
| Yarn | `packages/smb-server`, `packages/smb-front` (и при необходимости `smb-brand`) в `package.json` → `workspaces.packages` |
| Nx | `project.json` в каждом пакете (`projectType: library`, targets build/lint/test по образцу соседних) |
| TypeScript | пути/ссылки: dependency в `package.json` потребителя (`twenty-server` → `smb-server`, `twenty-front` → `smb-front`) + при необходимости path в tsconfig пакета |
| Docker | явные `COPY ./packages/smb-* …` в `packages/twenty-docker/twenty/Dockerfile` (и package.json на стадии deps) — иначе образ без нашего кода |

### CI: allowlist файлов-швов

`scripts/check-core-patches.sh` уже требует строку в `docs/PATCHES.md` для любого файла вне наших каталогов. Дополнение правила: **файлы-швы (P-002, P-003) можно менять только в пределах allowlist** — например, только добавление/удаление одной строки импорта `SmbServerModule` / `SmbFrontEntry`; любые иные правки тех же файлов — отдельный ID в реестре + ADR. Реализация: в `check-core-patches.sh` (или рядом) сравнение diff шва с разрешённым паттерном.

Записи реестра (состояние на 2026-10-09):

| ID | Файл | Что изменено | Статус |
|---|---|---|---|
| **P-002** | `packages/twenty-server/src/modules/modules.module.ts` (кандидат A) | импорт `SmbServerModule` + строка в `imports` — **2 строки** | **реализован 2026-10-12**: место подтверждено прогоном прототипа (`docs/reports/S-A2.md`), M1/M2 — M2 |
| **P-003** | `packages/twenty-front/src/index.tsx` | импорт `@/smb-skin/styles/smb-skin.css` (одна строка) | **реализован** |
| **P-013** | `modules/app/components/SharedAppProviders.tsx` | импорт + монтирование `<SmbSkinEntry />` | **реализован** (второй шов фронта, допущен владельцем) |

## Последствия

- **Плюсы:** рост модулей не размножает патчи ядра; merge upstream конфликтует в двух известных файлах; Nest/React подключают весь слой форка одним импортом.
- **Минусы:** дисциплина — нельзя «протащить» второй импорт мимо P-002/P-003; Docker/workspaces надо не забывать при добавлении пакета; риск Discovery (ниже) может сдвинуть серверный шов из `modules.module.ts` в `workspace-query-hook.module.ts`.
- **Процессно:** любой новый шов сверх P-002/P-003 = новый ADR + строка PATCHES.

## Риск: Nest Discovery и сторонний пакет

`WorkspaceQueryHookExplorer` берёт провайдеры через `DiscoveryService.getProviders()` и фильтрует по метаданным декоратора. Провайдер из `packages/smb-server` будет найден **только если** `SmbServerModule` (или модуль, где хук в `providers`) импортирован в дерево приложения, доступное Explorer'у.

**Прототип (обязателен до утверждения места P-002):**

1. Минимальный хук-пустышка в `smb-server`: `@WorkspaceQueryHook({ key: 'task.updateOne', type: PRE_HOOK })`, в `execute` — `Logger.log('smb stub: task.updateOne')`.
2. Импорт `SmbServerModule` только в `modules.module.ts` (кандидат A).
3. `updateOne` task через GraphQL — в логе сервера должна появиться строка stub.
4. Если Discovery **не** видит хук — перенести шов в `workspace-query-hook.module.ts` (кандидат B) и повторить; зафиксировать рабочий вариант в P-002.

Статус прогона: **ПРОГОНАН 2026-10-12** — отчёт `docs/reports/S-A2.md`. Кандидат A подтверждён: `WorkspaceQueryHookExplorer` видит провайдер из `packages/twenty-server/src/modules/smb-core/`, в логе сервера `LOG [SmbTaskUpdateOnePreHook] smb stub: task.updateOne workspace=20202020-1c25-4d02-bf25-6aeccf7ea419`. Кандидат B не понадобился; замер M1/M2 → **M2** (правок ядра 4 → 1).

## Что нужно проверить прототипом

1. Stub-хук `task.updateOne` + лог (см. выше) — выбор файла для P-002.
2. `SmbFrontEntry` подключает `brand.css` — light/dark видят `--t-*` (связка с ADR-005).
3. CI: правка шва вне allowlist → `check-core-patches` падает; разрешённая однострочная правка — проходит.
4. Docker multi-stage: образ содержит `smb-server`/`smb-front` dist после добавления COPY.
