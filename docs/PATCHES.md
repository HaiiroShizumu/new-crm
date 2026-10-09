# PATCHES — реестр правок ядра Twenty

Каждая правка файла **вне** наших каталогов фиксируется строкой здесь. Без строки —
CI (`check-core-patches`, `.github/workflows/fork-ci.yaml`) падает, MR в `main` блокируется.

## Правила

- Наше (без записи в реестр): `packages/twenty-front/src/modules/smb-*` (визуал, M2),
  `packages/smb-*`, `apps/`, `docs/`, `scripts/`, `smb/`, `.github/`, `.gitlab-ci*`
  — новый код только там (см. раздел «Форк» в `CLAUDE.md`).
  Паттерн в гейте: `^packages/twenty-front/src/modules/smb-[a-z0-9-]+/` —
  **только фронт и скин** (решение владельца 2026-10-09); серверная половина
  размещения (M1 против M2) остаётся открытой до A2 п.2.1.
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
| P-010 | .github/CODEOWNERS | в конец добавлены правила владельца форка (`@HaiiroShizumu`) на `docs/PATCHES.md`, `docs/adr/`, `docs/arch/`, `scripts/check-core-patches.sh`, `scripts/verify-citations.sh`, `.github/workflows/`; upstream-блок с командой Twenty сохранён | включить «Require review from Code Owners» по нашим путям; без этого PR в main мог бы пройти мимо владельца. Задача A3 (R02) | нет | низкий (дописывание в конец, не перезапись) |
