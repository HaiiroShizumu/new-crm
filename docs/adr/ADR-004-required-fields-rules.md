# ADR-004: Обязательные поля и декларативные правила валидации

**Статус:** Предложено (утверждение за владельцем)
**Дата:** 2026-10-08
**Основание:** `docs/arch/00-baseline-analysis.md` §2.1, §7.1 (п. 2)
**Связанные:** [ADR-003](ADR-003-business-processes.md) (правила на шагах процесса), [ADR-001](ADR-001-module-mechanism.md) (кто владеет правилами — App vs ядро)

> **Поправка 2026-10-12:** обязательные поля «свои у каждой задачи» решаются PRE-хуком по [ADR-011](ADR-011-tasks-forms-processes.md) п.3; этот ADR остаётся для правил уровня объекта.

---

## Контекст

Требование: «обязательные поля в зависимости от статуса» (например, при `IN_PROGRESS` у задачи обязателен `assignee`). Аудит (§2.1):

**Что есть — `isNullable` (глобальная обязательность), 5 уровней enforcement:**

1. field metadata (`isNullable`, дефолт `true` — `generate-nullable.ts:3-10`);
2. валидация метаданных при смене (`flat-field-metadata-validator.service.ts:235-245`, нужен default для non-nullable);
3. GraphQL non-null в create-input (`compute-field-input-type-options.util.ts:11-19` → `apply-type-options-for-create-input.util.ts:31-36`) — ошибка вида `Field "title" of required type "String!" was not provided`;
4. Postgres `SET NOT NULL` с backfill'ом (`update-field-action-handler.service.ts:263-274,624-644`);
5. JSON-schema `required` для AI-инструментов (`record-properties.json-schema.ts:181-208`).

**Пробелы `isNullable`:**

- **В UI нет индикатора обязательности:** ни звёздочки, ни свитча «Required» в настройках поля (там только `Unique` — `SettingsDataModelFieldIsUniqueForm.tsx:61-75`); `isNullable` в settings вообще не редактируется.
- null на клиенте **молча отбрасывается** (`sanitizeRecordInput.ts:63-65`, `computeOptimisticRecordFromInput.ts:100`) — пользователь не узнаёт об ошибке до ответа сервера;
- условной обязательности нет вообще (`rg isRequired|conditionalRequired` → 0).

**Ключевая находка: декларативные правила уже частично существуют — подсистема `validationRule`:**

- entity: `validation-rule.entity.ts:30-73` — `objectMetadataId`, `expression` (текст), `bindings` (jsonb), `message`, `errorFieldMetadataId`, `isActive`;
- оценка выражения: `compute-record-validation-rule-violations.util.ts:35-69` (`passed | failed | error`);
- **серверная проверка в транзакции записи**: `workspace-repository.ts:774-801` → `validateRecordsAgainstValidationRulesOrThrow` (`validate-records-against-validation-rules.util.ts:231-243`), ошибка `BAD_USER_INPUT` + `extensions.validationRuleViolations` (`record-validation-rule-graphql-api-exception-handler.util.ts:6-23`);
- **клиентская пред-проверка до отправки**: `SidePanelRecordCreationFormPage.tsx:122-171` (`computeDraftValidationRuleViolations`), ошибки рендерятся `:223-229` (`StyledValidationRuleErrors role="alert"`);
- UI настроек: `SettingsObjectValidationRulesSection.tsx`, форма `SettingsValidationRuleForm.tsx:51-96` («Must be true to save»), включение — feature-flag `IS_VALIDATION_RULES_ENABLED`.

**Альтернатива — PRE-hook:** `@WorkspaceQueryHook('task.updateOne', {type: PRE_HOOK})` + проверка + `throw` (образец `workspace-member-update-many.pre-query.hook.ts:15-30`), регистрация провайдера в `task-query-hook.module.ts:14-20` (сам `TaskQueryHookModule` уже подключён в `workspace-query-hook.module.ts:27`), работает для GraphQL и REST, мержит аргументы до запроса (`workspace-query-hook.service.ts:26-51`).

## Варианты

### A. Только метаданные (`isNullable`)

Обязательность — свойство поля, всегда и для всех: свитч «Required» в настройках поля, enforcement — существующие 5 уровней.

### B. Декларативные `requirementRules` (правила по статусам) с серверной проверкой

Новое правило вида «при статусе IN_PROGRESS поля X, Y обязательны»; на сервере — проверка до/в момент записи (PRE-hook **или** уже существующий `validationRule`-конвейер), на клиенте — подсветка и пред-проверка.

### C. Гибрид (рекомендуемая форма B)

- **Глобально-обязательные** поля — `isNullable:false` + свитч «Required» в настройках;
- **Условно-обязательные** — `requirementRules`, реализованные как надстройка над `validationRule` (правило генерируется/хранится как expression, enforcement — существующий repository-конвейер, PRE-hook — не дублируется, а зарезервирован для случаев «отказать до транзакции»).

## Критерии

| Критерий | A: `isNullable` | B: `requirementRules` (+PRE-hook) | C: гибрид |
|---|---|---|---|
| Покрытие сценария «по статусу» | нет — только всегда-обязательные | да | да |
| Когда срабатывает | GraphQL-валидация до/PG в транзакции | PRE-hook — до транзакции; validationRule — в транзакции с записью | по типу правила |
| UI-подсветка обязательности | надо добавить (свитч + звёздочка) | клиентская пред-проверка уже есть | свитч + звёздочка + условная подсветка |
| Миграция существующих данных | сложная: backfill + default (иначе `Default value cannot be null...`), запрет «мешает» записям без значения (см. `workspace-setup-system-prompt.constant.ts:52`) | не требуется — данные не трогаем | то же для условной части |
| Повторное использование готового | 5 уровней enforcement готовы | evaluator, ошибки, UI настроек, пред-проверка готовы | всё готово, добавляется тонкая обёртка |
| Переносимость на upstream | низкий риск (churn: валидация метаданных стабильна) | риск: свой слой поверх `validationRule` (молодая подсистема) | тот же, что B, но меньше своего кода |
| Bulk-операции (createMany/updateMany) | GraphQL поштучно | PRE-hook видит весь payload; validationRule — на каждую запись в транзакции | ок; проверить производительность |

## Решение (рекомендация)

**Вариант C — гибрид.**

### Схема `requirementRules`

Предлагаемая структура (хранение — как правило `validationRule` с structured `bindings`, чтобы не изобретать второй evaluator):

```jsonc
{
  "universalIdentifier": "…uuid…",
  "objectName": "task",
  "name": "Assignee required in progress",
  "when": { "field": "status", "in": ["IN_PROGRESS"] },   // условие (структурно или expression)
  "requireFields": ["assignee", "dueAt"],                  // что обязательно при выполнении условия
  "message": "Укажите исполнителя и срок при взятии в работу",
  "errorField": "assignee",                                // куда вешать ошибку; null → whole record
  "isActive": true
}
```

- Эквивалент expression для существующего движка: `record.status !== 'IN_PROGRESS' || (record.assignee != null && record.dueAt != null)` — оценка идёт штатным `createValidationRuleEvaluator`.
- Серверная точка enforcement — **существующий `validationRule` в репозитории** (в одной транзакции с записью, покрывает GraphQL и REST); PRE-hook `task.updateOne` добавляется только если проверка должна срабатывать *до* транзакции (например, запрет «перевести в IN_PROGRESS без assignee» с мутацией аргумента) — не дублировать обе.
- Глобально-обязательные поля: свитч «Required» в настройках поля по образцу `Unique` (`SettingsDataModelFieldIsUniqueForm.tsx:61-75`) → `isNullable:false`.

### Где UI подсвечивает обязательность

1. **Форма создания/редактирования записи** — звёздочка/метка у поля: `FormFieldInput.tsx:129` (там уже пробрасывается `isNullable`), условные правила — переоценка после изменения статуса (`FormSelectFieldInput.tsx:98-105`) с использованием готового `computeDraftValidationRuleViolations`;
2. **Ошибка при сохранении** — у конкретного поля (`errorField`) рендером как `StyledValidationRuleErrors` (`SidePanelRecordCreationFormPage.tsx:223-229`); для API/сторонних клиентов — `BAD_USER_INPUT` + `extensions.validationRuleViolations` (уже формируется);
3. **Настройки объекта** — секция правил (`SettingsObjectValidationRulesSection.tsx`) + свитч «Required» в настройках поля;
4. **Не подсвечиваем** в таблицах/списках — обязательность касается форм ввода.

## Последствия

- **Плюсы:** условная обязательность без миграций данных; минимум нового кода (обёртка над validationRule); единый язык правил (условная обязательность, формат, уникальность — одна подсистема); понятный UX ошибки.
- **Минусы:** зависимость от молодой подсистемы `validationRule` (churn не измерен — проверять); `isNullable:false` остаётся «коварным» механизмом (backfill, ломает существующие записи) — свитч «Required» должен предупреждать; проверка в репозитории — после попадания payload в транзакцию, PRE-hook может понадобиться для частных случаев; AI-инструменты видят обязательность только через JSON-schema `required` — условные правила им не сообщаются.

## Что нужно проверить прототипом

1. **Правило на живом объекте:** создать правило «IN_PROGRESS ⇒ assignee+dueAt» в настройках (или сидом), проверить create, update, переход статуса — сервер отклоняет с `message` у поля.
2. **Подсветка:** звёздочка в форме + условное появление после выбора статуса + блокировка submit с сообщением (до отправки на сервер).
3. **Bulk:** `updateMany`/`createMany` на 1 000 записей с активными правилами — время ответа (validationRule на каждую запись).
4. **Свитч «Required»:** включение на существующем поле с данными — что предлагает UI (backfill/default), не ломает ли импорт.
5. **Скоуп правил:** можно ли привязать правило к App-объекту и отключить вместе с модулем (пересечение с ADR-001/006).

## Поправки 2026-10-09

Верификация на базе `twenty/v2.45.6` (см. `docs/arch/02-verification-at-base.md`): подсистема `validationRule` на базе есть; ключа `validationRules` в `manifestType.ts` **нет**.

Дополнительные пункты прототипа:

6. **Доставка правила при установке модуля:** как создать `validationRule` при install App? Варианты для проверки: (а) post-install logic function через metadata API; (б) сид/upgrade-команда форка; (в) ручное создание в Settings. Ожидание — зафиксировать минимальный рабочий путь без патча ядра.
7. **UX отказа сервера:** что видит пользователь при `BAD_USER_INPUT` + `extensions.validationRuleViolations` (а) при перетаскивании карточки на канбане (смена `status`); (б) при inline-редактировании поля. Нужны скриншот/текст ошибки и откат optimistic UI (сейчас клиент молча отбрасывает null — `sanitizeRecordInput.ts`).

Рекомендация варианта C не менялась.
