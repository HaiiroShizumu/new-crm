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
  **`P-002` — серверный шов ADR-007** (импорт `SmbServerModule` в `CoreEngineModule`,
  ADR-013 п.1). `P-003` — шов фронта (одна строка в `index.tsx`),
  реализован на Этапе 2; второй шов фронта (эффект) получил `P-013`.
  Служебные правки (CODEOWNERS, `.gitignore`, `.dockerignore`) получили `P-010`…`P-012`.
  `P-020` (health-контроллер) снят 2026-10-12 (AR-8): сверка версий App отдаётся своим
  `GET /healthz/smb` из `smb-modules`, файл ядра возвращён к upstream; номер не переиспользовать.
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
| P-002 | packages/twenty-server/src/engine/core-modules/core-engine.module.ts | импорт `SmbServerModule` и строка в `imports` (2 строки) — единственный серверный шов форка | шов ADR-007 вариант B. **Перенесён 2026-10-12 из `modules/modules.module.ts` (ADR-013 п.1):** `ModulesModule` грузит только сервер, и по нему не собирается схема `/graphql`; `CoreEngineModule` грузят сервер, воркер и CLI, а его дерево входит в `include` core-схемы. `modules.module.ts` возвращён к upstream. Подключает агрегатор `packages/twenty-server/src/modules/smb-server.module.ts` (P-019) | нет | средний (список импортов ядра меняется upstream часто, но правка — отдельная строка в конце списка) |
| P-003 | packages/twenty-front/src/index.tsx | импорт `@/smb-skin/styles/smb-skin.css` — одна строка после `import './index.css'` | единственный импорт визуального слоя (ADR-005/007): из него `@import`-ом подключаются `smb-records.css` и бренд-слой; порядок после тем даёт переопределение | нет | низкий (одна строка после существующих импортов) |
| P-013 | packages/twenty-front/src/modules/app/components/SharedAppProviders.tsx | импорт + монтирование `<SmbSkinEntry />` внутри `<BaseThemeProvider>` | эффекту скина нужны jotai-атомы (а `JotaiProvider` живёт в `App.tsx`, выше по дереву) и срабатывание раньше snapshot'а `ThemeProvider` — поэтому он ребёнком `BaseThemeProvider`. Второй шов допущен решением владельца от 2026-10-09 | нет | средний (вложенность провайдеров меняется upstream) |
| P-014 | packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx | импорт `createSmbModuleRouteObjects`, комментарий P-014 и spread `...createSmbModuleRouteObjects()` — 3 строки | маршруты модулей форка из реестра `smb-modules/registry.ts`; реализовано в M-3, состав включённых модулей проверяет `SmbModuleRouteGate` (ADR-009 п.3–4) | нет | низкий (churn файла 7 за 6 мес.) |
| P-015 | packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx | импорт `SmbShellLayout` вместо `DefaultLayout` (стр. 18) и `element: <SmbShellLayout />` вместо `<DefaultLayout />` (стр. 128) — **2 строки** вместо обещанных одной (ADR-009 п.4; как P-014 = 3) | оболочка форка вместо штатной: боковая панель, верхняя панель, главная, пункты меню из реестра модулей (ADR-009 п.4–5, TODO U-2) | нет | средний (точка сборки роутера) |
| P-016 | TODO.md | новый файл в корне: очередь работ для агента | вход владельца 2026-10-12: список задач должен лежать в корне репозитория; у upstream такого файла нет | нет | низкий |
| P-017 | package.json | две новые строки scripts: `"smb:module"` (M-5) и `"smb:preset"` (M-6) | команды генератора модулей и пресетов (TODO M-5, M-6, ADR-009 «Процессно»); больше ядро не меняется | нет | низкий |
| P-010 | .github/CODEOWNERS | в конец добавлены правила владельца форка (`@HaiiroShizumu`) на `docs/PATCHES.md`, `docs/adr/`, `docs/arch/`, `scripts/check-core-patches.sh`, `scripts/verify-citations.sh`, `.github/workflows/`; upstream-блок с командой Twenty сохранён | включить «Require review from Code Owners» по нашим путям; без этого PR в main мог бы пройти мимо владельца. Задача A3 (R02) | нет | низкий (дописывание в конец, не перезапись) |
| P-018 | packages/twenty-apps/smb/ | каталог App модулей форка (создаёт `yarn smb:module new`, M-5) | каталог наш по ADR-009 п.1; **OURS расширен коммитом M-1** (2026-10-12, ревью владельца, bats M1-2/M1-5), строка оставлена как страховка | нет | низкий |
| P-019 | packages/twenty-server/src/modules/smb-* | новый файл `smb-server.module.ts` — агрегатор `SmbServerModule` (маркеры для генератора) | серверный шов P-002 по ADR-007; сам шов (import в `modules.module.ts`) в этой же строке. Каталоги `modules/smb-*/` с 2026-10-12 в OURS (M-1), строка покрывает файл уровня `modules/` | нет | низкий |
| P-021 | packages/twenty-front/src/utils/i18n/initialI18nActivate.ts | язык по умолчанию `APP_LOCALES['ru-RU']`, отключён детект языка браузера (правка >1 строки → ADR-012) | TODO U-6: русская локаль как язык по умолчанию для новых компаний | нет | низкий |
| P-022 | packages/twenty-server/src/engine/core-modules/auth/services/sign-in-up.service.ts | `:126-127` локаль нового участника по умолчанию `?? 'ru-RU'` вместо `?? 'en'` (ADR-012) | TODO U-6: язык нового workspace — русский | нет | низкий (рядом с лимитом 5 workspace — не тронут) |
| P-023 | packages/twenty-front/index.html | `:31` заголовок вкладки `<title>KeySpace</title>` вместо `Twenty` | TODO U-7: название продукта в видимом интерфейсе | нет | низкий |
| P-024 | packages/twenty-front/src/loading/components/UserOrMetadataLoader.tsx | файл целиком заменён реэкспортом `SmbAppShellSkeletonLoader as UserOrMetadataLoader` (ADR-014 п.3) | заглушка загрузки повторяет оболочку форка (рейл, верхняя строка, стеклянная панель, сохранённые настройки вида) вместо штатной раскладки; имя экспорта сохранено, поэтому `DomainShell`, `MinimalMetadataGate` и их тесты не тронуты | нет | низкий (при конфликте — «наш файл целиком») |
| P-025 | packages/twenty-front/src/modules/ui/layout/page/components/PageCardHeader.tsx | условие портала шапки: `workspaceSurface.type === 'side-panel'` дополнено `\|\| isDefined(workspaceSurfaceHeaderPortal.title)` + комментарий (ADR-014 п.2) | заголовок и действия страницы уходят в хосты оболочки через штатный `WorkspaceSurfaceHeaderPortalContext`; без хоста (мобильный, полный экран) поведение прежнее | да (обобщение штатного механизма) | средний (churn файла) |
| P-026 | packages/twenty-front/src/modules/views/components/ViewBar.tsx | импорт `ViewPickerDropdown` заменён на `SmbViewSwitcher` (2 места `leftComponent`), в `rightComponent` добавлен `<SmbChromeActionsSlot />` (ADR-014 п.2) | представления вкладками и действия страницы («Создать») в одной строке с фильтром и сортировкой | нет | средний |
| P-027 | packages/twenty-front/src/pages/settings/profile/appearance/components/SettingsExperience.tsx | импорт и `<SmbAppearanceSettings />` после `<SettingsAppearance />` — 2 строки | настройки оформления форка (обои, прозрачность, акцент, меню) на штатной странице «Опыт работы» | нет | низкий |
| P-028 | packages/twenty-front/public/wallpapers/ | новый каталог: 10 пресетов обоев (jpg, 1,1 МБ) из старого билда | на них ссылается `SMB_WALLPAPER_PRESETS`; без каталога обои по умолчанию отдавались как HTML (SPA-fallback) и фон был пустым | нет | низкий (новый каталог) |
| P-029 | packages/twenty-front/package.json | зависимость `react-virtuoso` (1 строка) | виртуальная лента сообщений мессенджера (ADR-010, отчёт R11) | нет | средний (список зависимостей меняется upstream; строка наша отдельная) |
| P-030 | yarn.lock | запись `react-virtuoso@4.18.16` (следствие P-029) | при конфликте перегенерируется `yarn install` | нет | высокий (файл меняется каждым обновлением; разрешение — перегенерация) |
| P-031 | packages/twenty-server/src/engine/core-modules/auth/auth.module.ts | в `exports` добавлены `SignInUpService`, `ResetPasswordService` (2 строки) | канал Б24 создаёт аккаунт сотрудника и выдаёт ссылку на установку пароля штатными сервисами (ADR-015) | нет | средний (список экспорта меняется upstream; строки наши отдельные) |
| P-032 | packages/twenty-front/src/utils/cookie-storage.ts | 2 импорта и одна строка: во фрейме cookie ставятся с `SameSite=None; Secure; Partitioned` | с `SameSite=Lax` токены сессии во фрейме чужого сайта не сохраняются, вход из Б24 не работает (ADR-015 п.6) | нет | низкий |
| P-033 | packages/twenty-front/src/modules/ui/layout/fullscreen/hooks/useShowFullscreen.ts | импорт и ранний `return true` во фрейме | во встроенном режиме боковая навигация скрыта (ADR-015) | нет | низкий |
