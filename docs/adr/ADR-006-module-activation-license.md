# ADR-006: Включение модулей (пресеты) и лицензирование

**Статус:** Предложено (утверждение за владельцем)
**Дата:** 2026-10-08
**Основание:** `docs/arch/00-baseline-analysis.md` §1a, §6, §5 (лимиты)
**Связанные:** [ADR-001](ADR-001-module-mechanism.md) (механизм модулей), [ADR-002](ADR-002-record-conversations.md) (SSO-зависимость моста)

---

## Контекст

Продукт продаётся наборами модулей («пресет» = включённый набор функций для workspace). Нужно: (1) механизм пресетов и место хранения состояния; (2) сверка с лицензионным инвентарём — какие файлы `/* @license Enterprise */` нельзя использовать и чем их заменять.

### Пресеты: что даёт штатный механизм

- **Состояние установки — строка `core.application` на workspace:** уникальный `(universalIdentifier, workspaceId)` (`application.entity.ts:41-49`), `state = INSTALLING|INSTALLED|UPGRADING|UNINSTALLING` (`:88-97`, `application-state.enum.ts:1-6`), `version` (`:81-83`), `autoUpgrade` (`:174-179`), `grantedCapabilities` (jsonb `:131-137`), `billing` (jsonb `:125-130`) — то есть поле под «что включено/какая лицензия» в entity уже предусмотрено.
- **Дистрибуция:** npm-реестр (marketplace: `marketplace.service.ts:50`, поиск `keywords:twenty-app` из `APP_REGISTRY_URL` `:119`, hourly cron-sync) **или** tarball на своём сервере (`application-package-fetcher.service.ts:77,215-229`); установка из UI (`useInstallMarketplaceApp.ts:131-137`) или CLI (`twenty app apply`).
- **Включение/выключение per workspace:** install/uninstall (каскад `application.entity.ts:244-291` убирает содержимое), upgrade с миграциями (`application-manifest-migration.service.ts:162`), pre/post-хуки (`applicationType.ts:39-42`).
- **Дополнительный гейт — feature flags per workspace:** `core.feature-flag`, уникальный `(key, workspaceId)` (`feature-flag.entity.ts:16-25`), чтение `feature-flag.service.ts:27-31`, админ-UI (`SettingsAdminFeatureFlagMetadata.ts:49`).

### Лицензионный инвентарь (сверка с §6)

- `rg -l "@license Enterprise" packages` → **475 файлов** (twenty-server 414, twenty-front 56, twenty-shared 5). Baseline §6.1 фиксирует 482 (расхождение: record-share 65 vs 71, usage 26 vs 27 — цифры baseline устарели на дату аудита; в пользу пересчёта).
- Файлы с этой пометкой **не под AGPLv3** (LICENSE:4-5) — использовать их в форке без коммерческой лицензии Twenty нельзя.
- Гейт `EnterpriseFeaturesEnabledGuard` покрывает **только SSO** (5 эндпоинтов `sso-auth.controller.ts:66-120` + `sso.resolver.ts:40-54`); прочие Enterprise-зоны закрыты иначе: RLS — `hasValidEnterprisePlan && hasEntitlement(RLS)` (`row-level-permission-predicate.service.ts:490-501`), audit — `event-logs.service.ts:191`, лимиты мест/воркспейсов — `sign-in-up.service.ts:576-581`, `custom-ai-provider-access.service.ts:43`.
- При `IS_BILLING_ENABLED=false` (дефолт, `config-variables.ts:942`) `hasEntitlement` возвращает `true` (`billing.service.ts:76-90`) — но SSO всё равно закрыт guard'ом (нужен валидный `ENTERPRISE_KEY`/токен), а RLS гейтится `hasValidEnterprisePlan` отдельно.
- **Ловушка в AGPL-части:** `MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY=5` (`max-workspaces-without-organization-key.constants.ts:1`, проверка — `sign-in-up.service.ts:576-581`) и `MAX_SEATS_WITHOUT_ENTERPRISE_KEY=25` (`max-seats-without-organization-key.constant.ts:6`) — Twenty сам ограничивает 5 workspace / 25 мест без Enterprise-ключа. Для коммерческого продукта это блокер уровня «порог роста клиента».

## Варианты

### A. Пресет = набор Apps, состояние — только штатное

Пресет — это curated-набор приложений (App-манифест), устанавливаемых в workspace одной командой; состояние — строки `core.application`; включение доп. фич — feature flags; продажа — свой npm/tarball-реестр (`APP_REGISTRY_URL`).

### B. Свой слой «module packs»

Своя сущность «пресет/подписка» (`packages/smb-*` + свои таблицы): свой биллинг-слой, свои лицензии, своя активация; Apps — только контейнером модуля.

### C. Гибрид

Пресеты — наборы Apps (штатный жизненный цикл, миграции, включение/выключение), но **активация/лицензия** — свой тонкий слой поверх `application.billing`/`grantedCapabilities` и feature flags; свой реестр дистрибуции; Enterprise-файлы upstream не подключаются.

## Критерии

| Критерий | A: только штатное | B: свой слой | C: гибрид |
|---|---|---|---|
| Где хранить состояние | `core.application` per workspace (готово) | свои таблицы (дублирование) | `core.application` + свои поля лицензии в jsonb/флаги |
| Механизм продажи/активации | нет (штатный billing — Enterprise) | полностью свой | свой тонкий гейт на install/флаги |
| Включение/выключение, обновления | штатные install/uninstall/upgrade + каскад | свои миграции + штатные | штатные |
| Лицензионные риски | 0 новых | 0 (свой код) | 0 новых (Enterprise-файлы не подключаются) |
| Зависимость от upstream | medium (churn application 356) | низкая, но много своего кода | medium |
| Дороговизна | минимальная | высокая | средняя |

## Решение (рекомендация)

**Вариант C.**

1. **Пресет** = упорядоченный набор App-ов (+ feature flags для «тонких» переключателей). Состояние «что включено у клиента» — строки `core.application` per workspace; не держать параллельный реестр установок.
2. **Дистрибуция** — свой реестр: свой `APP_REGISTRY_URL` + tarball (без публичного npm) или приватный npm; каталог marketplace штатный (cron-команда `marketplace:catalog-sync`).
3. **Активация/лицензия пресетов** — свой слой (патч-шов, регистрируемый в `PATCHES.md`): проверка лицензии при `installApplication`/включении feature-flag (аналог entitlement, но не `billing`-Enterprise). Заполнение `application.billing`/`grantedCapabilities` — через свой код, не через upstream-billing.
4. **Enterprise-каталоги upstream не использовать** (см. таблицу ниже) — не подключать и не вызывать; замены — свой код в `packages/smb-*`.
5. **Лимиты 5 workspace / 25 мест** — предмет отдельного решения (шов в `sign-in-up.service.ts` / свой ключ) — вынести в вопросы владельцу (README).

### Лицензионный инвентарь: нельзя и чем заменять

| Каталог (`@license Enterprise`) | Файлов | Что это | Использовать? | Чем заменять |
|---|---|---|---|---|
| `core-modules/billing` + `billing-webhook` | 166 + 22 | Stripe-биллинг, entitlements | **нет** | свой слой активации (вариант C) |
| `core-modules/enterprise` + `jwt` | 19 + 4 | валидация ENTERPRISE_KEY, ротация ключей | **нет** | своя лицензия; крипто-ключи — AGPL-часть auth |
| `core-modules/sso` + front settings SSO | 18 + часть 47 | SAML/OIDC-провайдеры (закрыты guard'ом) | **нет** | корпоративный вход через built-in google/microsoft/OIDC-подключение ИЛИ своя реализация; до этого — отказ от SSO в пресетах |
| `event-logs` | 15 | аудит (ClickHouse), `requiresEntitlement` | **нет** | свой модуль журналов событий (AGPL, `packages/smb-*`) |
| `record-share` | 65 | доступ к конкретной записи / «наблюдатели» | **нет** | своя сущность sharing поверх object-прав либо отказ (в ADR-002 наблюдатели не критичны) |
| RLS: `metadata-modules/row-level-permission-*` + `workspace-manager` row-level + `twenty-orm` SQL-фильтры + shared/front | 25 + 12 + 8 + 5 + ~5 | row-level предикаты | **нет** | object/field-права (AGPL-часть, `role.entity.ts:30-46`) + при необходимости — свой слой предикатов (шов в ORM — высокий риск, только отдельный ADR) |
| `usage`, `usage-limit` | 26 + 5 | квоты на API/email/webhook | **нет** | существующие конфиг-лимиты AGPL (`config-variables`, `usage-limit-definitions` — проверить, что не из Enterprise-зоны) либо свой middleware |
| `auth` (частично), `admin-panel`, `cloudflare`, `dns-manager`, `emailing-domain` | 10 + 3 + 2 + 1 + 4 | Enterprise-инфраструктура | **нет** | не входит в объём продукта |

**Итог сверки:** ни один Enterprise-каталог не является ядром Twenty — AGPL-часть собирается и работает без них; это «неиспользуемый функционал», а не вырезанная основа. Особая аккуратность — `twenty-orm`/RLS-фильтры: они ближе всего к ядру прав и требуют внимания при merge upstream (не из-за лицензии, а из-за близости к коду запросов).

## Последствия

- **Плюсы:** состояние пресетов — штатный жизненный цикл (включение/выключение/upgrade/миграции); 0 лицензионных претензий к файлам Enterprise; дистрибуция независима от публичного npm.
- **Минусы:** свой слой активации — новая точка поддержки (шов в hot-зоне application, churn 356); SSO/аудит/RLS придётся либо не давать, либо строить своими силами — а SSO заявлен в ADR-002 как аргумент Enterprise-Mattermost (противоречие снимается: SSO — собственная реализация или отказ); лимиты 5/25 без ключа — прямой блокер на масштабе.
- **Процессно:** пересчёт инвентаря (475 vs 482) лучше сделать CI-задачей, чтобы §6 baseline не устаревала.

## Что нужно проверить прототипом

1. **Пресет одной кнопкой:** install-джоба на набор из 2–3 App-ов (например, hello-world + своя «беседа») — состояние, отключение (uninstall) и повторное включение без потери/с сохранением данных.
2. **Свой реестр:** `APP_REGISTRY_URL` на локальный tarball-сервер — установка без npm; обновление версии пресета (semver, запрет даунгрейда).
3. **Гейт активации:** попытка установить «платный» модуль без лицензии — отказ на `installApplication`/включении флага; с лицензией — ок. Сколько файлов ядра тронуто (ожидание: 1–2, в реестре PATCHES.md).
4. **Лимиты:** воспроизвести `MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY=5` / `MAX_SEATS=25` на dev — где срабатывает, какой минимальный шов нужен.
5. **Чистая сборка:** убедиться, что ни один Enterprise-файл не активируется при `IS_BILLING_ENABLED=false` и без `ENTERPRISE_KEY` (кроме зафиксированных guard'ов) — точечный аудит вызовов.

## Поправки 2026-10-09

Верификация на базе `twenty/v2.45.6` (см. `docs/arch/02-verification-at-base.md`, утв. №6 и №7):

- `@license Enterprise` на базе: **475** файлов (совпадает с пересчётом в этом ADR; baseline §6.1 «482» — устарело относительно базы).
- `MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY = 5` — файл `packages/twenty-server/src/engine/core-modules/auth/constants/max-workspaces-without-organization-key.constants.ts:1`, **без** `@license Enterprise`; проверка в `sign-in-up.service.ts:536-542,569-581` через `workspaceRepository.count()` — лимит на **инстанс** (все workspace), не на один workspace.
- `MAX_SEATS_WITHOUT_ENTERPRISE_KEY = 25` — файл `.../enterprise/constants/max-seats-without-organization-key.constant.ts:6`, **с** `@license Enterprise`; считается как `COUNT(DISTINCT userId)` по `userWorkspace` на инстанс (`enterprise-plan.service.ts:386-393`); гейтит custom AI providers, не «места в workspace» как product-seat CRM.
- `sign-in-up.service.ts` — первая строка без `@license Enterprise` (AGPL-часть auth).

Вопрос №9 владельцу (в `docs/adr/README.md`) переформулирован с учётом привязки к инстансу. Рекомендация варианта C не менялась.
