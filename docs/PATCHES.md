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
| P-002 | packages/twenty-server/src/modules/modules.module.ts | импорт `SmbServerModule` и строка в `imports` — единственный серверный шов форка | шов ADR-007 вариант B, реализован 2026-10-12 (спайк A2, выбор кандидата A); подключает `packages/twenty-server/src/modules/smb-server.module.ts` (агрегатор, P-019) | нет | средний (файл доменных модулей, churn низкий) |
| P-003 | packages/twenty-front/src/index.tsx | импорт `@/smb-skin/styles/smb-skin.css` — одна строка после `import './index.css'` | единственный импорт визуального слоя (ADR-005/007): из него `@import`-ом подключаются `smb-records.css` и бренд-слой; порядок после тем даёт переопределение | нет | низкий (одна строка после существующих импортов) |
| P-013 | packages/twenty-front/src/modules/app/components/SharedAppProviders.tsx | импорт + монтирование `<SmbSkinEntry />` внутри `<BaseThemeProvider>` | эффекту скина нужны jotai-атомы (а `JotaiProvider` живёт в `App.tsx`, выше по дереву) и срабатывание раньше snapshot'а `ThemeProvider` — поэтому он ребёнком `BaseThemeProvider`. Второй шов допущен решением владельца от 2026-10-09 | нет | средний (вложенность провайдеров меняется upstream) |
| P-014 | packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx | импорт `createSmbModuleRouteObjects`, комментарий P-014 и spread `...createSmbModuleRouteObjects()` — 3 строки | маршруты модулей форка из реестра `smb-modules/registry.ts`; реализовано в M-3, состав включённых модулей проверяет `SmbModuleRouteGate` (ADR-009 п.3–4) | нет | низкий (churn файла 7 за 6 мес.) |
| P-015 | packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx | импорт `SmbShellLayout` вместо `DefaultLayout` (стр. 18) и `element: <SmbShellLayout />` вместо `<DefaultLayout />` (стр. 128) — **2 строки** вместо обещанных одной (ADR-009 п.4; как P-014 = 3) | оболочка форка вместо штатной: боковая панель, верхняя панель, главная, пункты меню из реестра модулей (ADR-009 п.4–5, TODO U-2) | нет | средний (точка сборки роутера) |
| P-016 | TODO.md | новый файл в корне: очередь работ для агента | вход владельца 2026-10-12: список задач должен лежать в корне репозитория; у upstream такого файла нет | нет | низкий |
| P-017 | package.json | две новые строки scripts: `"smb:module"` (M-5) и `"smb:preset"` (M-6) | команды генератора модулей и пресетов (TODO M-5, M-6, ADR-009 «Процессно»); больше ядро не меняется | нет | низкий |
| P-010 | .github/CODEOWNERS | в конец добавлены правила владельца форка (`@HaiiroShizumu`) на `docs/PATCHES.md`, `docs/adr/`, `docs/arch/`, `scripts/check-core-patches.sh`, `scripts/verify-citations.sh`, `.github/workflows/`; upstream-блок с командой Twenty сохранён | включить «Require review from Code Owners» по нашим путям; без этого PR в main мог бы пройти мимо владельца. Задача A3 (R02) | нет | низкий (дописывание в конец, не перезапись) |
| P-018 | packages/twenty-apps/smb/ | каталог App модулей форка (создаёт `yarn smb:module new`, M-5) | каталог наш по ADR-009 п.1; **OURS расширен коммитом M-1** (2026-10-12, ревью владельца, bats M1-2/M1-5), строка оставлена как страховка | нет | низкий |
| P-019 | packages/twenty-server/src/modules/smb-* | новый файл `smb-server.module.ts` — агрегатор `SmbServerModule` (маркеры для генератора) | серверный шов P-002 по ADR-007; сам шов (import в `modules.module.ts`) в этой же строке. Каталоги `modules/smb-*/` с 2026-10-12 в OURS (M-1), строка покрывает файл уровня `modules/` | нет | низкий |
| P-020 | packages/twenty-server/src/engine/core-modules/health/controllers/health.controller.ts | импорт `withSmbModulesVersionWarning` и вызов `.then(...)` в `check()` — блок `smbModulesVersionWarning` при расхождении версий App | сверка «версия App ↔ код образа» должна быть видна в health (TODO M-7, ADR-009 «Что нужно проверить» №5); здоровый ответ не меняется | нет | низкий |
| P-021 | packages/twenty-front/src/utils/i18n/initialI18nActivate.ts | язык по умолчанию `APP_LOCALES['ru-RU']`, отключён детект языка браузера (правка >1 строки → ADR-012) | TODO U-6: русская локаль как язык по умолчанию для новых компаний | нет | низкий |
| P-022 | packages/twenty-server/src/engine/core-modules/auth/services/sign-in-up.service.ts | `:126-127` локаль нового участника по умолчанию `?? 'ru-RU'` вместо `?? 'en'` (ADR-012) | TODO U-6: язык нового workspace — русский | нет | низкий (рядом с лимитом 5 workspace — не тронут) |
| P-023 | packages/twenty-front/index.html | `:31` заголовок вкладки `<title>KeySpace</title>` вместо `Twenty` | TODO U-7: название продукта в видимом интерфейсе | нет | низкий |
