# S5 — лимит 25 мест на инстанс: что именно он блокирует

**Дата:** 2026-10-12 · **Исполнитель:** Hermes · **Ветка:** `chore/docs-and-tooling`
**Вход:** TODO `S5` · `docs/adr/ADR-008-instance-topology-b24-gateway.md` «Что нужно проверить» п.5.
**Метод:** перебор всех мест использования константы в коде (чтение, без запуска — см. NOT RUN).

---

## Сделано

Полный поиск `MAX_SEATS_WITHOUT_ENTERPRISE_KEY` / `seatCount` / `ENTERPRISE_SEAT_THRESHOLD_EXCEEDED`
по `packages/twenty-server/src` и `packages/twenty-front/src` (с исключением сгенерированных
`locales/generated/*`).

## Результат

Константа одна: **`MAX_SEATS_WITHOUT_ENTERPRISE_KEY = 25`**
(`packages/twenty-server/src/engine/core-modules/enterprise/constants/max-seats-without-organization-key.constant.ts:6`).

Порог применяется **ровно в одном правиле** — `hasCustomAiProviderAccess`
(`enterprise/utils/has-custom-ai-provider-access.util.ts:17-19`):

```
isBillingEnabled || hasValidEnterprisePlan || seatCount <= 25
```

Счётчик мест — **на весь инстанс, без разреза по компаниям**: `getBillableSeatCount()`
(`enterprise/services/enterprise-plan.service.ts:386-394`) считает
`COUNT(DISTINCT userWorkspace.userId)` по всем workspace инстанса.
То есть при 5 × 50 = 250 пользователях `seatCount ≈ 250 > 25` → правило ложно для self-hosted
установки без `ENTERPRISE_KEY`.

### Все места использования (исчерпывающе)

| # | Файл:строка | Что делает |
|---|---|---|
| 1 | `core-modules/admin-panel/services/admin-panel-ai-provider.service.ts:36-49` | **Единственное место броска** `EnterpriseException(…, ENTERPRISE_SEAT_THRESHOLD_EXCEEDED)` — `assertCustomAiProviderAccess()` перед добавлением/изменением кастомного AI-провайдера из админ-панели |
| 2 | `metadata-modules/ai/ai-models/services/ai-model-registry.service.ts:665-684` | только **текст ошибки**: если кастомный провайдер не зарегистрирован, запрос модели `provider/model` даёт «Model not found. Custom AI providers require a valid enterprise key above 25 seats» |
| 3 | `core-modules/enterprise/utils/has-custom-ai-provider-access.util.ts:19` | сам предикат (см. выше) |
| 4 | `core-modules/enterprise/services/custom-ai-provider-access.service.ts:34-52` | `computeAccess()` → GraphQL-запрос `getCustomAiProviderAccess` (`enterprise.resolver.ts`) |
| 5 | `core-modules/enterprise/enterprise.exception.ts:19,42-43` | код исключения и его человекочитаемое сообщение |
| 6 | `core-modules/enterprise/enterprise-exception.filter.ts:29` | маппинг кода в HTTP-ответ |
| 7 | `core-modules/enterprise/cron/jobs/organization-key-validation.cron.job.ts:49-55`, `enterprise-plan.service.ts:396-427, 609-623` | **не блокировка**: отправка счётчика мест в API Enterprise (отчётность ключа) |
| 8 | `packages/twenty-front/src/modules/settings/admin-panel/ai/hooks/useCustomAiProviderAccess.ts:26-30` (+ graphql-запрос, тип) | только **подсказка в UI** админ-панели «Custom providers are complimentary up to N seats» |
| 9 | `enterprise/utils/__tests__/has-custom-ai-provider-access.util.spec.ts` | тесты предиката |

### Что он блокирует при 5 × 50 = 250

- **Только кастомных (BYOK) AI-провайдеров**: добавление провайдера в админ-панели и
  запросы моделей кастомного провайдера.
- **Не блокирует:** приглашение и работу пользователей, число компаний (это отдельная
  константа `MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY = 5`, `sign-in-up.service.ts:569-587`),
  письма, файлы, AI-функции на штатных моделях каталога, бэкапы, экспорт.

**Подтверждение тезиса ADR-008 п.5 («по отчёту — только custom AI providers»): подтверждено** —
других мест применения порога в коде нет.

## NOT RUN

- Живое воспроизведение «251-й пользователь открывает админ-панель» — потребовало бы создания
  226 тестовых пользователей на инстансе; заменено полным перебором мест использования.
- Побочные лимиты Enterprise-плана (`hasValidEnterprisePlan` для других функций) — вне рамок S5:
  там порог не 25, а наличие ключа; отдельная тема до юриста (DIRECTIVE §3.7).

## Расхождения

1. Счётчик мест **инстансовый, не по-компанийный** — в ADR-008 п.5 это не было указано;
   для модели «5 компаний × 50 пользователей» это означает, что порог 25 превышается уже
   **на третьей компании** (если считать по инстансу), а не на шестой.
2. Файл `has-custom-ai-provider-access.util.ts` помечен `/* @license Enterprise */` —
   мы его только читали, не изменяли (DIRECTIVE §3.7 соблюдён).

## Вопросы

1. Учитывать ли лимит 25 в описании продукта клиентам («BYOK-AI требует Organization-ключа»)?
   — это вопрос к плану v3 §7 (O-8, юрист).
