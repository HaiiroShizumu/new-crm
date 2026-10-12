# ADR-003: Процессы (BPM) — человеческие шаги, задания, SLA

**Статус:** Предложено (утверждение за владельцем)
**Дата:** 2026-10-08
**Основание:** `docs/arch/00-baseline-analysis.md` §3
**Связанные:** [ADR-001](ADR-001-module-mechanism.md) (пресеты процессов как App), [ADR-004](ADR-004-required-fields-rules.md) (обязательность на шагах), [ADR-002](ADR-002-record-conversations.md) (уведомления)

> **Поправка 2026-10-12:** «человеческий шаг» и способ пробуждения уточнены в [ADR-011](ADR-011-tasks-forms-processes.md) п.1 и п.4 — при расхождении действует ADR-011.

---

## Контекст

Twenty имеет зрелый движок workflow, но «бетрикс24-шный» процесс — это прежде всего **человеческие шаги**: задание-согласование с исполнителем, ролями, сроком и журналом. Аудит (§3):

**Есть штатно:** граф шагов с параллельными ветками (`Promise.all` + join, `workflow-executor.workspace-service.ts:92-101`), триггеры DATABASE_EVENT/MANUAL/CRON/WEBHOOK (`workflow-trigger.type.ts:9-14`), 22 типа шагов (в т.ч. `FORM` — пауза до ответа человека, `DELAY`; `WAIT_FOR_EVENT` есть только в upstream-ревизии аудита, см. «Версии ревизий» ниже), журнал `stepLogs` (jsonb, cap 256 КБ), retry/stop, версия — **снапшот** `state.flow` при старте run (`workflow-run.workspace-service.ts:700-720`) — живые запуски не ломаются при публикации новой версии.

**Нет (§3.4–3.5):** шага-«задания» с исполнителем-человеком и статусами approve/reject; ролей/делегирования у шага (`workflow-action-settings.type.ts:23-33` — только `outputSchema` и `errorHandlingOptions`); SLA/эскалаций; отката на шаг; шаблонов процессов (только `duplicateWorkflow`); email-триггера.

**Ключевые опоры для расширения:**

- Сон шага: `stepInfos[stepId].status = PENDING`, run продолжается, пока есть PENDING (`workflowShouldKeepRunning`, `workflow-executor.workspace-service.ts:379`); пробуждение — `resumeAnsweredStep` (`workflow-runner.workspace-service.ts:109`).
- «Мои задания» уже рисуются готовой вью `assignedToMe` с фильтром `assigneeIsMe` (`packages/twenty-shared/src/metadata/constants/standard-object.constant.ts:1039-1068`; серверный аналог `compute-standard-task-views.util.ts:42`).
- Пресет процесса можно поставлять манифестом: `manifestType.ts:37` `workflows?: WorkflowManifest[]` (сейчас только MANUAL-триггер — `workflowManifestType.ts:10-21`).
- UI-таб настроек шага — общий для всех шагов: `SidePanelWorkflowStepSettingsContent.tsx:64-89` (там лежат `errorHandlingOptions`) — минимальное место для поля «исполнитель».

**Версии ревизий (важно для патчей):** база форка — `twenty/v2.45.6` (`docs/arch/UPSTREAM_BASE.md`): в ней **нет** `WAIT_FOR_EVENT`/`workflow-wait`/`pendingWakeUp`/`submitFormStep`; FORM-пауза работает через `pendingEvent` + `answerToolCall` → `resumeAnsweredStep`. Аудит baseline описан по upstream `0cd095bfe8`, где уже есть generic wait (`CALLBACK|TIME|EVENT`). Любые патчи делаются на текущей базе, а при merge новой версии upstream надо сверяться: upstream-механика wait может «приехать» и изменить точку расширения.

**Risks:** зоны `modules/workflow` 256, `workflow-executor` 137, `twenty-front/modules/workflow` 206 коммитов/6мес — топ-10 опасных мест (§7.2).

## Варианты

### A. Расширить штатные workflow шагами-«заданиями»

Новый/доработанный тип шага: настройки `assignee`/роль/срок/действия approve-reject; ожидание — существующий PENDING; пробуждение по кнопке «задание выполнено». Патчи: `BaseWorkflowActionSettings` (TS + zod в twenty-shared), executor, UI-таб настроек, possibly новый резолвер-аналог `resumeAnsweredStep`.

### B. Отдельная модель «process template / process instance / step instance»

Свои сущности (шаблон → экземпляр → экземпляр шага) в workspace-схеме, со своей версией шаблона и состоянием; автоматические шаги делегируются workflow, человеческие — свой слой. Практически — новый подсистемный модуль.

### C. Workflow как исполнитель + свой слой «человеческих шагов»

Штатный workflow исполняет автоматику; человеческий шаг моделируется задачей (`task` с assignee/dueAt/status) и связью «задача ↔ шаг run»: workflow создаёт задачу (CREATE_RECORD), «спит» (PENDING/FORM), завершение задачи (query-hook/database event) продолжает run. Эмуляция approval — статусы задачи/записи.

## Критерии

| Критерий | A: шаг-задание в workflow | B: своя модель процессов | C: workflow + слой задач |
|---|---|---|---|
| **Версионирование живых экземпляров** | штатный снапшот `state.flow`; риск — миграция jsonb-настроек старых run'ов при добавлении полей | свой слой: шаблон версионируется, instance ссылается на версию — полный контроль, но строить с нуля | штатный снапшот workflow; задача — обычный объект с историей изменений |
| **SLA/таймеры** | DELAY/WAIT штатны; эскалация/принудительное завершение — своя логика + уведомления (модуля нет, §4.4) | срок хранится у step instance — гибко; таймеры/эскалации всё равно свои | срок = `dueAt` задачи, «просрочено» — готовая подсветка (`TaskRow.tsx:138-143`) + cron; эскалация — своя |
| **Делегирование** | смена assignee в настройках шага или в run — нужен UI и маппинг ролей | встроенная модель ролей step instance — самая гибкая | смена assignee задачи — штатные средства records/прав |
| **Журнал** | `stepLogs` шага + новый статус задания | свой журнал экземпляров + интеграция с `stepLogs` | журнал задачи (timeline) + `stepLogs` run — двойной, но готовый |
| **UI «мои задания»** | своё окно (или инжект в run-view) | своё окно с нуля | **готовая вью `assignedToMe`/фильтр `assigneeIsMe`** — без нового UI |
| **Совместимость с upstream** | низкая: патчи в 4 зонах churn 137–256 | высокая (патчей почти нет) — но огромный объём нового кода | **высокая**: точка расширения — query-hook (`task`, churn 9) и database events; патчи движка — минимум |

## Решение (рекомендация)

**Вариант C — workflow как исполнитель + свой слой человеческих шагов на базе задач.**

1. Процесс = штатный workflow: автоматика, ветвление, таймеры (`DELAY`), параллельность, журнал — без патчей движка.
2. Человеческий шаг = запись `task` (assignee, dueAt, status) со ссылкой на шаг run; завершение/отклонение задачи возвращает сигнал в run через PRE-hook `task.updateOne` (новый хук в `modules/task/query-hooks`; `TaskQueryHookModule` уже подключён в `workspace-query-hook.module.ts:27`) или database-event → продолжение по аналогии с `resumeAnsweredStep`.
3. Шаблоны процессов и модули согласований — через app-манифест `workflows[]` (ADR-001).
4. «Мои задания» — существующая вью `assignedToMe`; SLA — `dueAt` + cron-эскалация (её блокирует отсутствие модуля уведомлений — общий риск с ADR-002).
5. Эволюция в A допустима, если C упрётся в UX approval (нужны veto/rollback): тогда — отдельный ADR и регистрация шва в `PATCHES.md`.

## Последствия

- **Плюсы:** минимум патчей в самых опасных зонах (workflow churn 256/137/206); переиспользование готового UI задач, прав, журналов; шаблоны — бесплатно через Apps.
- **Минусы:** approval «эмулируется» — нет полноценной (first-class) семантики «согласовано/отклонено» на шаге, нет rollback по графу (как и у A/B — rollback отсутствует везде); связь «задача ↔ шаг run» — своя сущность/поля и своя дисциплина консистентности (процесс может жить неделями); двойной журнал (задача + stepLogs) требует склейки в UI.
- **Процессно:** при merge upstream следить за приведением generic wait-mechanics (см. Контекст) — точка пробуждения может смениться.

## Что нужно проверить прототипом

1. **Каркас «шаг-задание»:** workflow CREATE_RECORD(task) → FORM/PENDING-пауза → заполнение задачи → PRE-hook `task.updateOne` → продолжение run. Реально ли разбудить run из hook'а без патча executor'а (ожидание: да, через ту же очередь `RunWorkflowJob`)?
2. **Долгоживущий процесс:** run «спит» 3 дня (DELAY), задача досрочно закрыта — корректное отмена/продолжение, идемпотентность.
3. **Версии:** публикация новой версии workflow во время «спящего» run — снапшот не рвёт связь «задача ↔ шаг».
4. **«Мои задания»:** фильтр `assignedToMe` показывает задачи процесса, просрочка подсвечивается; хватает ли полей (process link) без нового объекта.
5. **SLA-прототип:** cron-эскалация «задача процесса просрочена» — с минимальным каналом уведомления (см. риск ADR-002) — оценка объёма.
6. **Сверка с upstream:** после merge следующего тега — не изменилась ли механика PENDING/wait (`workflow-executor.workspace-service.ts`).

## Поправки 2026-10-09

Верификация на базе `twenty/v2.45.6` (см. `docs/arch/02-verification-at-base.md`):

### Альтернатива пробуждения run (без серверного хука)

Кроме PRE-hook `task.updateOne` → `resumeAnsweredStep` (вариант C, п. 2 решения), на базе доступна **альтернатива без патча ядра**:

1. Logic function с `databaseEventTriggerSettings` на `task.updated` (манифест App).
2. Функция через client SDK вызывает публичную мутацию продолжения run — на базе это механизм FORM-ответа: GraphQL `answerToolCall` → `ToolCallAnswerService` → `workflowRunnerWorkspaceService.resumeAnsweredStep` (`tool-call-answer.service.ts:245`, `workflow-runner.workspace-service.ts:109`).
3. `submitFormStep` и generic `WAIT_FOR_EVENT` на базе **отсутствуют** (появляются только в более новых ревизиях upstream).

### Что работает на базе

| Путь пробуждения | На базе `twenty/v2.45.6` | Патч ядра |
|---|---|---|
| PRE-hook `task.updateOne` → `resumeAnsweredStep` / очередь `RunWorkflowJob` | механизмы есть (`TaskQueryHookModule` уже в `workspace-query-hook.module.ts:27`; `resumeAnsweredStep` есть) | нужен провайдер хука (шов / `packages/smb-*`) |
| Logic function `task.updated` → client SDK → `answerToolCall` | **работает без серверного хука** (`pendingEvent` в FORM, мутация `answerToolCall` публична) | 0 |

Для варианта C на текущей базе **предпочтительна logic-function альтернатива** (0 патчей ядра); PRE-hook — если нужна синхронная проверка до коммита или отказ без отдельного App-рантайма. Рекомендация варианта C не менялась.
