# PATCHES — реестр правок ядра Twenty

Каждая правка файла **вне** наших каталогов фиксируется строкой здесь. Без строки —
CI (`check-core-patches`, `.github/workflows/fork-ci.yaml`) падает, MR в `main` блокируется.

## Правила

- Наше (без записи в реестр): `packages/twenty-front/src/modules/smb-*` (визуал, M2),
  `packages/twenty-server/src/modules/smb-*` (сервер, M1),
  `packages/twenty-apps/smb/` (App модулей), `packages/smb-*`, `apps/`, `docs/`,
  `scripts/`, `smb/`, `.github/`, `.gitlab-ci*`
  — новый код только там (см. раздел «Форк» в `CLAUDE.md`).
  Паттерны в гейте: `^packages/twenty-front/src/modules/smb-[a-z0-9-]+/`,
  `^packages/twenty-server/src/modules/smb-[a-z0-9-]+/`, `^packages/twenty-apps/smb/`
  (решения владельца 2026-10-09 и 2026-10-12, ADR-009 п.4; расширение OURS —
  отдельный коммит M-1 с bats-кейсами M1-1…M1-5). Серверный паттерн точный:
  каталоги upstream-модулей `twenty-server/src/modules/*` в OURS не входят.
- Всё остальное (ядро Twenty) — строка в таблице ниже, обязательна.
- Правка ядра больше одной строки — дополнительно ADR: `docs/adr/ADR-NNN-<тема>.md`
  (каталог ADR — `docs/adr/`, см. `docs/adr/README.md`; исторические решения — `docs/arch/NN-<тема>.md`).
- `ID` — последовательный; старые ID не переиспользовать.
  **`P-002` зарезервирован за серверным швом ADR-007** (импорт `SmbServerModule`) —
  он остаётся открытым до Этапа 1. `P-003` — шов фронта (одна строка в `index.tsx`),
  реализован на Этапе 2; второй шов фронта (эффект) получил `P-013`.
  Служебные правки (CODEOWNERS, `.gitignore`, `.dockerignore`) получили `P-010`…`P-012`.
- `Файл` — точный путь от корня репозитория; можно указать каталог с `/` на конце
  или glob (`packages/twenty-front/src/**/Foo.tsx`) — проверка матчит по glob.
- Исключения: `locales/*.po` и `locales/generated/*` — перегенериваются i18n-пайплайном
  и не коммитятся, если задача не про переводы (в реестр не вносятся).
- Обновление с upstream: конфликты разрешаются **только** по этому реестру
  (порядок — `docs/arch/UPSTREAM_BASE.md`).

Столбцы: `ID | Файл | Что изменено | Зачем | Можно в upstream? | Риск конфликта`.

## Реестр

| ID | Файл | Что изменено | Зачем | Можно в upstream? | Риск конфликта |
| --- | --- | --- | --- | --- | --- |
| P-001 | CLAUDE.md | добавлен раздел «Форк» (5 правил для агентов) | контроль правок ядра форка; ADR: `docs/arch/01-fork-agent-rules.md` | нет | высокий |
| P-012 | .dockerignore | добавлены `ECC`, `.cursor`, `.claude`, `.ecc`, `docs`, `smb`, `*.log` в ignore-список | эти каталоги не участвуют в `COPY` Dockerfile, но 242M ECC раздувают контекст сборки → замедление каждой сборки; задача A5 (R02) | нет | низкий |
| P-011 | .gitignore | добавлено `docs/tooling/*.log` (и комментарий) перед правилом `mcp.json` | логи тулинга форка не должны попадать в git; задача A6 (R02) | нет | низкий |
| P-002 |  | **зарезервировано за швом ADR-007** — импорт `SmbServerModule` в ядро сервера | шов появится на Этапе 1 (`docs/adr/ADR-007-unified-stitch.md`); свободным не является | нет | средний |
| P-003 | packages/twenty-front/src/index.tsx | импорт `@/smb-skin/styles/smb-skin.css` — одна строка после `import './index.css'` | единственный импорт визуального слоя (ADR-005/007): из него `@import`-ом подключаются `smb-records.css` и бренд-слой; порядок после тем даёт переопределение | нет | низкий (одна строка после существующих импортов) |
| P-013 | packages/twenty-front/src/modules/app/components/SharedAppProviders.tsx | импорт + монтирование `<SmbSkinEntry />` внутри `<BaseThemeProvider>` | эффекту скина нужны jotai-атомы (а `JotaiProvider` живёт в `App.tsx`, выше по дереву) и срабатывание раньше snapshot'а `ThemeProvider` — поэтому он ребёнком `BaseThemeProvider`. Второй шов допущен решением владельца от 2026-10-09 | нет | средний (вложенность провайдеров меняется upstream) |
| P-014 | packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx | импорт `createSmbModuleRouteObjects`, комментарий P-014 и spread `...createSmbModuleRouteObjects()` — 3 строки | маршруты модулей форка из реестра `smb-modules/registry.ts`; реализовано в M-3, состав включённых модулей проверяет `SmbModuleRouteGate` (ADR-009 п.3–4) | нет | низкий (churn файла 7 за 6 мес.) |
| P-015 |  | **зарезервировано** — одна строка в точке сборки оболочки: наша оболочка вместо штатной | шов появится в задаче U-2 (ADR-009 п.4–5); файл выбирается при переносе navigation | нет | средний |
| P-016 | TODO.md | новый файл в корне: очередь работ для агента | вход владельца 2026-10-12: список задач должен лежать в корне репозитория; у upstream такого файла нет | нет | низкий |
| P-017 | package.json | одна новая строка: скрипт `"smb:module": "node scripts/smb-module.mjs"` | команда генератора модулей (TODO M-5, ADR-009 «Процессно»); больше ядро не меняется | нет | низкий |
| P-010 | .github/CODEOWNERS | в конец добавлены правила владельца форка (`@HaiiroShizumu`) на `docs/PATCHES.md`, `docs/adr/`, `docs/arch/`, `scripts/check-core-patches.sh`, `scripts/verify-citations.sh`, `.github/workflows/`; upstream-блок с командой Twenty сохранён | включить «Require review from Code Owners» по нашим путям; без этого PR в main мог бы пройти мимо владельца. Задача A3 (R02) | нет | низкий (дописывание в конец, не перезапись) |
| P-018 | packages/twenty-apps/smb/ | каталог App модулей форка (создаёт `yarn smb:module new`, M-5) | каталог наш по ADR-009 п.1; **OURS расширен коммитом M-1** (2026-10-12, ревью владельца, bats M1-2/M1-5), строка оставлена как страховка | нет | низкий |
