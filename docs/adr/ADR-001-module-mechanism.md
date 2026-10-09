# ADR-001: Механизм поставки модулей

**Статус:** Предложено (утверждение за владельцем)
**Дата:** 2026-10-08
**Основание:** `docs/arch/00-baseline-analysis.md` §1, §7.1–7.2
**Связанные:** [ADR-006](ADR-006-module-activation-license.md) (пресеты и лицензия), [ADR-005](ADR-005-visual-layer.md) (швы визуального слоя)

---

## Контекст

Форк Twenty продаёт функциональность «модулями» (беседы, процессы, отчётность…). Модуль должен устанавливаться/отключаться per-workspace, по возможности правиться клиентом и выживать при обновлении форка слиянием тегов upstream каждые 4–6 недель (`docs/arch/UPSTREAM_BASE.md`). Каждый патч файла ядра — это конфликт при следующем обновлении и строка в `docs/PATCHES.md`.

Факты из аудита:

- **Twenty Apps** — штатный декларативный механизм: манифест (`packages/twenty-shared/src/application/manifestType.ts:36-60`) включает `objects`, `fields`, `views`, `pageLayouts`, `navigationMenuItems`, `commandMenuItems`, `frontComponents`, `logicFunctions`, `workflows`, `roles`; установка через CLI `twenty app apply` → GraphQL `installApplication` (`packages/twenty-server/src/engine/core-modules/application/application-install/application-install.resolver.ts:165`, async-вариант `triggerInstallApplicationJob` `:187`); порядок шагов — pre-hook → применение манифеста → post-hook (`application-install.service.ts:388-399`, `:477`).
- Состояние — строка `core.application` на workspace: уникальный индекс `(universalIdentifier, workspaceId)` (`application.entity.ts:41-49`), `state` (`:88-97`), `version` (`:81-83`), `autoUpgrade` (`:174-179`); содержимое модуля каскадно зависит от приложения (`:244-291`) — install/uninstall/upgrade трогают данные целиком.
- Версионирование и миграции есть: запрет даунгрейда, `upgradeApplication` (`application-upgrade.service.ts:51-293`), миграция метаданных из манифеста (`application-manifest-migration.service.ts:166`).
- **Ограничения Apps:** серверных query-hook'ов и произвольных GraphQL-резолверов из app нет (`rg -l "WorkspaceQueryHook" packages/twenty-apps ...` → 0, `rg -l "Resolver" packages/twenty-sdk/src` → пусто); кросс-app ссылки запрещены; front-компоненты изолированы (Web Worker + Remote DOM, «partial DOM, so advanced usages can fail» — `packages/twenty-docs/developers/extend/apps/layout/overview.mdx:57,59`).
- **Путь «standard object» через код ядра** (альтернатива Apps): билдер в `create-standard-flat-object-metadata.util.ts:17`, UUID в `standard-object-universal-identifiers.constant.ts`, реестр `STANDARD_OBJECTS` (`standard-object.constant.ts:9`), стандартный конфиг страницы (`standard-task-page-layout.config.ts:20-63`), пункт меню (`build-standard-flat-navigation-menu-item-maps.util.ts:21`).
- **Churn** (коммитов upstream/6мес): `core-modules/application` 356 (самая активная зона), `page-layout` 257, `twenty-standard-application` 223; при этом `query-hook` 9, `task` 8, `createWorkspaceRouteObjects.tsx` 7, `FieldDisplay/FieldInput` 0.
- Флаги включения per-workspace уже есть: сущность `core.feature-flag`, уникальный `(key, workspaceId)` (`feature-flag.entity.ts:16-25`).

## Варианты

### A. Twenty Apps (манифест данных)

Весь модуль — npm-пакет/tarball с манифестом; объекты, страницы, пункты меню, логика — данными. Патчей ядра — 0.

### B. Пакеты `packages/smb-*` + швы в ядрах + feature flags

Код модуля живёт в своих пакетах (`packages/smb-*`, `apps/` по правилам `docs/PATCHES.md`), но встраивается точечными швами в ядро (билдеры standard-объектов, конфиги страниц, реестры), включение — feature-flags per workspace.

### C. Гибрид

Модуль по умолчанию — App (манифест); швы в ядра — только там, где возможностей Apps не хватает (серверные хуки, свои типы полей, тяжёлый UI), каждый шов регистрируется в `docs/PATCHES.md`; включение — install/uninstall App + feature-flags.

## Критерии

| # | Критерий | A: Apps | B: smb-* + швы | C: гибрид |
|---|---|---|---|---|
| 1 | Количество патчей ядра на модуль | **0** | 5–8 файлов на модуль | 0 у типовой части, швы — точечно |
| 2 | Переносимость на новые версии upstream | максимальная (патчей нет) | низкая: швы в зонах churn 223–356 коммитов конфликтуют при каждом merge | высокая: швов мало и они в зонах churn ≤ 10 |
| 3 | Клиент может править модуль или написать свой | да — свой app + CLI (`twenty app init/apply`), но только в пределах возможностей манифеста | да — полный код, но правка шва требует доступа к ядру и строки в реестре | да: типовой уровень — App, продвинутый — шов под PATCHES.md |
| 4 | Включение/выключение по workspace | да, штатно (install/uninstall/upgrade строки `core.application`) | да, но только флагом — код и метаданные остаются | да (оба механизма) |
| 5 | Миграции данных модуля | да, штатно (версии, запрет даунгрейда, `syncMetadataFromManifest`) | свои миграции вручную (upgrade-команды форка) | да для App-части, свои — для швов |

## Решение (рекомендация)

**Вариант C — гибрид, с Apps как базовым механизмом.**

1. Модуль = App-манифест, где это возможно (объекты, страницы, пункты меню, команды, вью, workflows, логика). Патчи ядра — не нужны.
2. Швы в ядра — только по исчерпывающему списку из `docs/PATCHES.md`, каждая правка >1 строки = отдельный ADR (правило `docs/arch/01-fork-agent-rules.md`). Швы предпочтительно держать в зонах churn ≤ 10 (query-hook, task, роутинг), избегать зон топ-10 (`00-baseline-analysis.md` §7.2).
3. Включение по workspace — через install/uninstall App; feature-flags — как дополнительный гейт для швов, не как основной механизм.

## Последствия

- **Плюсы:** минимум конфликтов при rebasing на upstream; включение/выключение и миграции данных модуля — штатный жизненный цикл Twenty; клиент может писать свои модули без доступа к ядру форка.
- **Минусы:** функционал вне возможностей манифеста (серверные CRUD-хуки, произвольные резолверы, свои типы полей, «тяжёлый» UI вне Remote DOM) потребует швов и части модуля в `packages/smb-*`; зона `core-modules/application` — самая активная у upstream (356 коммитов/6мес), сам механизм Apps может меняться; front-компоненты через Remote DOM ограничены (partial DOM).
- **Процессно:** каждая новая зона шва удлиняет реестр `PATCHES.md` и работу по merge.

## Что нужно проверить прототипом

### Мини-прототип «Hello module» (аналитический расчёт)

Задача: объект + страница + пункт меню — без запуска стека, расчёт по коду.

**Вариант A (Apps) — 0 файлов ядра:**

| Элемент | Реализация | Ядро |
|---|---|---|
| Объект `hello` | `defineObject` в app — образец: `packages/twenty-apps/examples/hello-world/src/objects/example-object.ts` | 0 |
| Страница | `pageLayouts` в манифесте; статический роут `/page/:pageLayoutId` уже есть (`packages/twenty-shared/src/types/AppPath.ts:26`, роут `createWorkspaceRouteObjects.tsx:109`) | 0 |
| Пункт меню | `defineNavigationMenuItem` — `.../hello-world/src/navigation-menu-items/example-navigation-menu-item.ts:5-10` (`NavigationMenuItemType.VIEW` → `viewUniversalIdentifier`) | 0 |
| Вью/поля | `example-view.ts`, `example-field.ts` того же app | 0 |
| **Итого** | | **0** |

**Вариант B (шов в ядро) — ≈6 файлов ядра на тот же объём:**

1. `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts:17` — билдер объекта;
2. `packages/twenty-shared/src/metadata/constants/standard-object-universal-identifiers.constant.ts` — UUID;
3. `packages/twenty-shared/src/metadata/constants/standard-object.constant.ts:9` — реестр `STANDARD_OBJECTS`;
4. standard-конфиг страницы + universalIdentifier (`standard-page-layout*.config.ts`, `standard-page-layout-universal-identifiers.constant.ts:253`);
5. `.../navigation-menu-item/build-standard-flat-navigation-menu-item-maps.util.ts:21` — пункт меню;
6. при новом типе поля — `FieldDisplay.tsx:58` + `FieldInput.tsx:50` (+ регенерация `generated-metadata/graphql.ts`, churn 404 — перезаписывается).

### Открытые вопросы для живого прототипа (когда стек будет поднят)

1. `twenty app apply` на реальном dev-стеке: фактическое число файлов и время установки Hello module (ожидание — 0 патчей, подтверждение аналитики).
2. Отключение: `uninstallApplication` полностью убирает объект/страницу/меню и данные каскадом? Что остаётся в workspace-схеме?
3. Апгрейд: `updateApplication` Hello module с добавленным полем — миграция данных без потери записей.
4. Виджет «чата записи» (см. ADR-002) через `WidgetType.FRONT_COMPONENT`: хватает ли Remote DOM или потребуется шов.
5. Ограничение: клиент правит установить модуль? (`settingsMenuItems`/`commandMenuItems` — можно ли править установленный App в UI или только переустановкой).
