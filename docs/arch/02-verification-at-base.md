# 02 — Верификация фактов baseline/ADR на базе форка

**Цель:** механически проверить, что ссылки и несущие утверждения верны на базе форка `twenty/v2.45.6` (`6007ad5a7f6cb676fd8a9ff0c2a86a2e3d4c260e`), а не только на upstream `main` (`0cd095bfe8`), по которому писался аудит.
**Дата:** 2026-10-09.
**Код продукта:** не менялся.
**Worktree базы:** `../new-crm-base` (`git worktree add ../new-crm-base twenty/v2.45.6`).
**Скрипт ссылок:** [`scripts/verify-citations.sh`](../../scripts/verify-citations.sh) → [`02-citations.csv`](02-citations.csv).

Слово «подтверждено» ниже — только для фактов, проверенных командой на теге базы. Иначе — **NOT RUN**.

---

## 1. Сводка ссылок (`02-citations.csv`)

Источник: `docs/arch/00-baseline-analysis.md` + `docs/adr/ADR-*.md`. Всего извлечено **421** ссылка `path:line` / `path:from-to`.

| status | count |
|---|---|
| OK | 381 |
| AMBIGUOUS | 19 |
| LINE_DRIFT | 11 |
| MISSING_IN_BASE | 10 |

### MISSING_IN_BASE (на базе нет файла / путь не резолвится)

| citation | doc | exists_main | комментарий |
|---|---|---|---|
| `packages/twenty-cli/.../pre-install-logic-function-config.type.ts:6-12` | baseline | EXISTS | файл появился после v2.45.6 |
| `.../application-install-steps.constant.ts:1-8` | baseline | EXISTS | сокращённый путь / файл на базе иначе |
| `pre-install-logic-function-config.type.ts:15` | baseline | EXISTS | то же |
| `storage.ts:31` | baseline | MISSING | слишком короткий basename, ложное срабатывание regex |
| `-group.entity.ts:1` | baseline | MISSING | артефакт regex от `…predicate.entity.ts:1` и `-group.entity.ts:1` |
| `workflow-agent-human-input-prompt.constant.ts:1` | baseline | EXISTS | нет на базе |
| `pending-wake-up-condition-schema.ts:4-14` (×2) | baseline | EXISTS | generic wait — только newer upstream (см. ADR-003) |
| `workflow-step-wait.workspace-service.ts:15-32` | baseline | EXISTS | то же |
| `messaging-...-monitoring.cron.job.ts:52` | baseline | MISSING | усечённый путь в тексте аудита |

### LINE_DRIFT (файл есть, номер строки вне файла на базе)

Примеры: `workspace-query-hook.decorator.ts:9-37`, `task-query-hook.module.ts:9-19` / `:14-20`, `modules.module.ts:50`, `font.ts:4-32`, `WorkflowActionType.ts:1-24`, `twenty-standard-applications.ts:11-26`, `getTabsRenderableForTargetObject.ts:33-52`, `should-execute-child-step.util.ts:29-41`.

### AMBIGUOUS

Чаще всего корневые `package.json`, `.yarnrc.yml`, локализованные `*.mdx`, одинаковые basenames (`TaskRow.tsx`, `main.ts`, `vite.config.ts`). Для корня monorepo скрипт не предпочитает `./package.json` автоматически — статус оставлен AMBIGUOUS.

---

## 2. Двенадцать несущих утверждений

| # | Утверждение | На базе | path:line + цитата (≤1 строки) |
|---|---|---|---|
| 1 | Подсистема `validationRule` есть; флаг `IS_VALIDATION_RULES_ENABLED`; файлы **без** `@license Enterprise` | **VERIFIED** | `.../validation-rule/entities/validation-rule.entity.ts:30` — `export class ValidationRuleEntity`; util `.../validate-records-against-validation-rules.util.ts:1` — `import { isNonEmptyString }…` (нет Enterprise); флаг — `twenty-shared/.../FeatureFlagKey.ts:18` — `IS_VALIDATION_RULES_ENABLED = '…'` |
| 2 | `WidgetType.FRONT_COMPONENT` и ветка в `WidgetContentRenderer` | **VERIFIED** | `WidgetContentRenderer.tsx:85` — `case WidgetType.FRONT_COMPONENT:` |
| 3 | FORM-пауза: `pendingEvent` + `answerToolCall` + `resumeAnsweredStep`; `submitFormStep` и generic `WAIT_FOR_EVENT` **нет** | **VERIFIED** | `form.workflow-action.ts:46` — `return { pendingEvent: true };`; `workflow-runner.workspace-service.ts:109` — `async resumeAnsweredStep({`; `rg submitFormStep` / `WAIT_FOR_EVENT` на базе — пусто |
| 4 | `TaskQueryHookModule` в `modules.module.ts`; список модулей-хуков | **CHANGED** | На базе `TaskQueryHookModule` **не** в `modules.module.ts` (там только Messaging/Calendar/…/Workflow/WorkspaceMember). Подключение: `workspace-query-hook.module.ts:27` — `TaskQueryHookModule`. Хуки: AgentChatThread, Messaging, Calendar, Dashboard, Blocklist, WorkspaceMember, Note, **Task**, Timeline |
| 5 | Ключи манифеста Apps: `validationRules`? `pageLayoutTabs` для стандартных объектов? | **VERIFIED** (уточнение) | `manifestType.ts:37-59`: есть `pageLayoutTabs`, **нет** `validationRules`. Docs `extending-objects.mdx:47` — таб на standard layout через `definePageLayoutTab` + `STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS` |
| 6 | `MAX_WORKSPACES` / `MAX_SEATS`: значения, место проверки, привязка workspace vs инстанс, `@license` | **VERIFIED** | Workspaces: `= 5`, константа **без** Enterprise (`max-workspaces-….constants.ts:1`); проверка `sign-in-up.service.ts:536` — `workspaceRepository.count()` → **инстанс**. Seats: `= 25`, константа **с** `/* @license Enterprise */`; `getBillableSeatCount` — `COUNT(DISTINCT userId)` по инстансу. `sign-in-up.service.ts:1` — без Enterprise |
| 7 | Число файлов `@license Enterprise` vs 475/482 | **VERIFIED** | `rg -l '@license Enterprise' packages \| wc -l` → **475** (server 414, front 56, shared 5). Совпадает с ADR-006; baseline «482» — дрейф относительно базы |
| 8 | `standard-task-page-layout.config.ts`: сколько вкладок | **VERIFIED** | 2 вкладки: `home` и `note` (`TASK_PAGE_TABS`, строки 20–63) |
| 9 | `EnterpriseFeaturesEnabledGuard` — те же 2 файла использования | **VERIFIED** | Usage: `sso-auth.controller.ts`, `sso.resolver.ts` (+ определение guard). Иных usage-файлов нет |
| 10 | Запрет кросс-app ссылок; app-объект может иметь relation на standard `task` | **VERIFIED** | `page-layouts.mdx:156` — «Cross-app references … are not supported today»; `extending-objects.mdx:49-51` — relation к standard object через `defineField` + `FieldType.RELATION` (пример Person; тот же паттерн для task) |
| 11 | `ThemeProvider` overrides; `--t-*` без `!important` | **VERIFIED** | `ThemeProviderProps.ts:12` — `overrides?: ThemeOverrides`; `ThemeProvider.tsx:26` — `overrides`; `grep -c '!important' theme-light.css` → **0** |
| 12 | Нет модуля notification | **VERIFIED** | `ls …/core-modules \| rg -i notif` → пусто |

---

## 3. Изменённые / новые ADR

| Документ | Что сделано |
|---|---|
| [ADR-002](../adr/ADR-002-record-conversations.md) | Раздел «Поправки 2026-10-09»: убрано «права наследуются от записи»; прототип №3 — object-права + шов ADR-007 |
| [ADR-003](../adr/ADR-003-business-processes.md) | Альтернатива пробуждения через logic function + `answerToolCall`; на базе предпочтителен путь без серверного хука |
| [ADR-004](../adr/ADR-004-required-fields-rules.md) | Прототипы: доставка `validationRule` при install; UX отказа на канбане и inline-edit |
| [ADR-006](../adr/ADR-006-module-activation-license.md) | Поправки по п.6/7; вопрос №9 в README переформулирован (лимиты на **инстанс**) |
| [ADR-007](../adr/ADR-007-unified-stitch.md) | **Новый:** единый шов `smb-server` / `smb-front`, P-002/P-003, Docker/workspaces, риск Nest Discovery |
| [docs/adr/README.md](../adr/README.md) | Строка ADR-007; вопрос 9 переписан |

Рекомендации вариантов (A/B/C) в ADR **не менялись молча** — только разделы поправок и уточнения фактов.

---

## 4. NOT RUN

| Что | Почему |
|---|---|
| Живой stub `@WorkspaceQueryHook('task.updateOne')` в `smb-server` + лог | Код продукта не менялся; прототип зафиксирован в ADR-007 как обязательный до выбора файла P-002 |
| `twenty app apply` / install validationRule через post-install | Нужен поднятый стек; вынесено в прототипы ADR-004 |
| UX канбана/inline при отказе validationRule | Нужен UI-прогон |
| Пересборка Docker с `COPY packages/smb-*` | Пакетов `smb-*` ещё нет |

---

## 5. Команды (воспроизведение)

```bash
git worktree add ../new-crm-base twenty/v2.45.6
./scripts/verify-citations.sh
# семантические проверки — из worktree ../new-crm-base, см. вывод агента 2026-10-09
rg -l '@license Enterprise' packages | wc -l   # → 475
rg -c '!important' packages/twenty-ui/src/theme/theme-light.css  # → 0
ls packages/twenty-server/src/engine/core-modules | rg -i notif  # → пусто
```
