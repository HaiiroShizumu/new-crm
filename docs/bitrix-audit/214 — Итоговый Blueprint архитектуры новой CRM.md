<!-- bitrix note.document id=214 collectionId=10 updatedAt=2026-10-07T14:39:48+03:00 -->

# 00 — Итоговый Blueprint архитектуры новой CRM
### Синтез аудита коробки «1С-Битрикс24» (`/bitrix/modules/`) в единую целевую спецификацию

> **Основание:** четыре отчёта этапа, 2 795 строк, все выводы — по чтению реального кода и DDL.
>
> | Файл | Объём | Ключевой объект |
> |---|---|---|
> | `01_company_structure_and_permissions.md` | 843 строки | оргструктура (iblock → humanresources), closure-таблица, `b_crm_role*`, materialized ACL `b_crm_access_attr_*`, `b_module_group` |
> | `02_crm_core_and_smart_processes.md` | 735 строк | `Container/Factory/Item/Operation`, смарт-процессы, стадии/категории, поля, таймлайн, корзина |
> | `03_chat_and_realtime_engine.md` | 627 строк | `im` (69 таблиц) + `pull` (5 таблиц): доставка, счётчики, дельта-синхронизация, push |
> | `04_telephony_and_openlines.md` | 590 строк | `voximplant` (25 таблиц) + `imopenlines` (30 таблиц): роутинг звонков, очереди, SLA |
>
> **Масштаб коробки по замеру:** 108 модулей, 98 677 PHP-файлов, 8 638 552 строк;
> в 26 модулях с миграциями описано 1 013 таблиц и 1 981 индекс (только crm — 258/702).

---

## 1. Вердикт аудита (что делать нельзя — коротко)

### 1.1. Паттерны, которые обязаны пережить переезд

| # | Паттерн | Где в коробке | Почему работает |
|---|---|---|---|
| 1 | **Closure table / `ltree` для иерархии** | `b_hr_structure_node_path` (этап 1) | константные ответы «все подчинённые» без рекурсии в приложении |
| 2 | **Права как данные (materialized ACL)** | `b_crm_access_attr_*` (этап 1) | один JOIN/IN вместо сотен; индекс вместо вычисления |
| 3 | **Роли = строки `role × entity × op × scope`** | `b_crm_role_perms` (этап 1) | ABAC в реляционном виде; слияние ролей = `MAX()` |
| 4 | **Субъектные коды доступа** (`U6`, `SND7`, `G5`) | `b_user_access` (этап 1) | антикоррупционный слой между оргструктурой и правами |
| 5 | **Command → транзакция → post-commit side-effects** | `TransactionWrapper` (этап 2) | bizproc/automation строго после COMMIT |
| 6 | **Декларативные дескрипторы полей** | `Factory::getFieldsSettings()` (этап 2) | одно описание = валидация, форма, список, REST |
| 7 | **Capability-флаги в конфигурации типа** | `b_crm_dynamic_type.IS_*` (этап 2) | тип сам декларирует возможности, код не ветвится |
| 8 | **Идемпотентность по UUID** | `b_im_message_uuid` (этап 3) | exactly-once поверх at-least-once транспорта |
| 9 | **Батчинг событий в памяти + flush после ответа** | `Pull\Event::onAfterEpilog` (этап 3) | 1 publish на запрос вместо N |
| 10 | **Теговые каналы вместо fan-out** | `IM_PUBLIC_*` + `b_pull_watch` (этап 3) | одно событие на чат, не на участника |
| 11 | **Коалесцирование счётчиков + overflow-таблица** | `b_im_counter_overflow` (этап 3) | бейдж «1000+» без подсчёта миллионов строк |
| 12 | **Дельта-синхронизация через upsert-карту** | `b_im_log UNIQUE(user,entity)` (этап 3) | объём ответа ∝ изменившимся сущностям |
| 13 | **Выделенная таблица дедлайнов** | `b_imopenlines_session_check` (этап 4) | SLA сканируются индексно |
| 14 | **Round-robin по метке активности** | `LAST_ACTIVITY_DATE[_EXACT]` (этап 4) | распределение без блокировок |
| 15 | **SSRF-валидатор с пиннингом IP** | `voximplant/lib/security/PublicUrlValidator` (этап 4) | fail-closed + защита от DNS rebinding — **эталон** |
| 16 | **Advisory-lock против параллельного создания** | `uf_add_*`, `CRM_LEAD_LOCK`, `imol_transfer_chat_id_*` | гонки webhook'ов и DDL |
| 17 | **Агент-миграции: курсор + чанки + переключатель + dual-write** | `ReFillDynamicTypeAttr`, `StructureBackwardConverter` | безопасный перенос больших данных |

### 1.2. Антипаттерны, которые нельзя переносить

| # | Антипаттерн | Масштаб в коробке |
|---|---|---|
| 1 | Три параллельные модели одной сущности + «переводчик» | iblock-структура / humanresources / access codes; legacy `CIM*` / `V2`; `CCrmPerms` / новый стек |
| 2 | Документ вместо инкапсуляции (`@internal DON'T CALL DIRECTLY`) | `Item::save()` — единственный способ сохранения |
| 3 | Обход проверки прав как параметр вызова | `disableCheckAccess()/disableAllChecks()` в 20+ местах crm, `skipUserCheck` в im, `SKIP_ACCESS_CHECK='Y'` |
| 4 | Runtime DDL (`ALTER/CREATE/DROP TABLE` в веб-запросе) | пользовательские поля `b_uts_*`, смарт-процессы, ACL-таблицы |
| 5 | Хранение «непрочитанного» строкой на сообщение | `b_im_message_unread` = O(участники × сообщения) |
| 6 | Сериализованные массивы в текстовых колонках | `QUEUE_HISTORY`, `EXECUTION_GRAPH`, `CRM_BINDINGS` |
| 7 | God-config в колонках | `b_imopenlines_config` — 80+ колонок, `b_crm_dynamic_type` — 19 флагов |
| 8 | «Индекс под каждый медленный запрос» | 702 индекса в crm, 48 на `b_crm_requisite`, 22 на `b_crm_deal` |
| 9 | Магические числовые диапазоны вместо идентичности | `CCrmOwnerType` 3 990 строк: +17 / +64 / «паритет» для suspended |
| 10 | Потеря событий при сбое доставки | `Pull\Event`: статические массивы + `trigger_error`, push: `DELETE` до отправки |
| 11 | Состояние ошибок в module option | `pull.nginx_error` как `serialize()` в `b_option` |
| 12 | Флаги-конверты вместо системного актора | `WAIT_FULL_EXECUTION`, `convertMode`, `system message` в im; `SKIP_COMMAND` |
| 13 | Мемоизация с асимметричными ключами | `PermissionsManager::load()` — порядко-зависимый fail-closed |
| 14 | Валидация «первого элемента» | `RoleUtil::validatePermissions()`: `return` внутри `foreach` |

### 1.3. Топ уязвимостей (требуют фикса при переносе)

1. **Replay webhook'ов**: подпись на `md5` без timestamp/nonce (`voximplant/vi_http.php`), сравнение через `===`.
2. **TLS отключён при публикации realtime-событий**: `disableSslVerification()` с комментарием `//todo: remove` (`pull/pull_channel.php`).
3. **Бессрочные подписанные токены**: `PermissionToken` без `exp/jti` (crm).
4. **Слабая валидация идентификаторов прав**: `validatePermissions()` + конкатенация `PERMISSION_ID` в `LIKE` (`main/Access/Permission/AccessPermissionTable`).
5. **Контекст «пользователь по умолчанию = 1»** в публичной веб-форме + пустые заглушки проверок + отброшенный `Result` (`crm/lib/webform/resultentity.php`).
6. **TOCTOU при распределении диалогов**: проверка слотов и назначение не в транзакции (`imopenlines`).
7. **Гонка создания ACL**: `upsert` через `COUNT→INS​ERT` без транзакции с записью сущности (`crm`).
8. **100-суточный TTL кэшей прав** без гарантированной инвалидации (`AttributesProvider`, `PermissionsManager`).
9. **Отсутствие транзакции** в классическом пути сохранения CRM (транзакция есть только в autorun).
10. **Гостевые отрицательные id** и `CHANNEL_ID` из POST в публичном long-poll endpoint (`pull.request/ajax.php`).

---

## 2. Целевая архитектура

### 2.1. Границы сервисов

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   EDGE                                       │
│   API Gateway (authn, rate-limit, idempotency-key) · CDN · WebSocket upgrade │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │
┌──────────────▼───────────── APPLICATION (commands + queries) ────────────────┐
│ identity   │ org        │ crm-core      │ chat        │ contact-center      │
│ auth,      │ org units, │ entities,     │ messages,   │ lines, sessions,    │
│ sessions,  │ members,   │ stages,       │ reads,      │ queues, calls       │
│ roles      │ hierarchy  │ fields, files │ counters    │ deadlines           │
├────────────┼────────────┼───────────────┼─────────────┼─────────────────────┤
│ policy     │ timeline   │ search        │ realtime    │ notification        │
│ PDP/PEP,   │ activities │ index writer, │ gateway     │ inbox, email,       │
│ ACL index  │ comments   │ query         │ (WS/push)   │ mobile push         │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ ports (interfaces)
┌──────────────▼───────────────────────────────────────────────────────────────┐
│ PostgreSQL (первая истина) · Redis (кэш, подписки, семафоры) ·                 │
│ Kafka/Redpanda (события) · Object storage (файлы, записи звонков) ·            │
│ OpenSearch/PG FTS (поиск) · Vault (секреты)                                   │
└───────────────────────────────────────────────────────────────────────────────┘
```

Правила границ:
* **`policy` — единственное место, где принимаются решения о доступе.** Любой сервис вызывает PDP
  через gRPC и применяет результат; отключить проверку нельзя ни параметром, ни флагом —
  только получив `SYSTEM_ACTOR`-контекст с записью в аудит.
* **`realtime` не знает бизнес-логики**: он доставляет событие подписчику и умеет replay по курсору.
* **`search` — read-model**, строится из событий; у него свой индекс и своя деградация.
* **`contact-center` не пишет в `chat` напрямую**, а издаёт команды (`session.assign`, `session.transfer`).

### 2.2. Кросс-модульные инварианты (не обсуждаются)

1. Любая команда записи имеет `idempotency_key`; повтор безопасен и возвращает прежний результат.
2. Побочные эффекты (события, индексы, push, уведомления) — **только после COMMIT** через outbox.
3. Никакого DDL в рантайме: изменения схемы — миграции, подтверждённые в CI.
4. Никаких `skip_check`-параметров: обход = отдельный системный контекст + аудит-запись.
5. Каждая сущность имеет `created_at/updated_at/deleted_at`; удаление — состояние, не «другой тип».
6. Идентичность сущности — строковый код; числовые диапазоны и паритет запрещены.
7. Иерархия — одна модель (`ltree` + closure), read-model строится из неё.
8. Доступ к данным — через репозиторий, который без policy не компилируется/не проходит линт.
9. Кэши прав: TTL ≤ 60 с, версия в ключе (`policy:v{N}`), инвалидация по событию.
10. Любой внешний fetch — через `SafeFetcher` (валидация схемы/адресов + пиннинг IP).
11. Подписи webhook'ов: HMAC-SHA256 по канонизированному JSON + `X-Timestamp` (±5 мин) + nonce.
12. Счётчики — материализованные, с overflow-защитей и nightly-reconciler'ом.
13. Логи — append-only, с `trace_id`, без содержимого переписки и токенов в открытом виде.
14. Классы/модули ≤ ~1 000 строк; легаси-фасад удаляется в том же релизе, где появился.

### 2.3. Сводная модель данных (детали — в отчётах 01–04)

```sql
-- ORG (отчёт 01, §5.1)          org_structure, org_node (+ltree), org_node_closure, org_member
-- POLICY (отчёт 01, §5.2)       rbac_role, subject_code, rbac_role_subject, policy_rule
-- ACL INDEX (отчёт 01, §5.2)    acl_item (PARTITION BY entity_type) — read-model из событий
-- CRM CORE (отчёт 02, §5.1)     crm_entity (attrs JSONB), crm_field, crm_category, crm_stage
-- ACTIVITY/TIMELINE (02, §5.1)  crm_activity (PARTITION BY created_at), crm_timeline (+source_key)
-- CHAT (отчёт 03, §5.1)         chat, chat_member (last_read_message_id), message (PARTITION),
--                               chat_member_counter, message_search, sync_log
-- CONTACT CENTER (отчёт 04)     phone_line, call, call_queue(+member), line, line_session,
--                               session_deadline, line_operator
```

Связи между блоками — только по внешним ключам и через события; «тёмные» ссылки
(`b_crm_chat`, `ENTITY_TYPE/ENTITY_ID` в 20 таблицах) заменены на типизированные ссылки
`link(entity_type, entity_id, kind)` в одном месте.

### 2.4. Шина событий (единый транспорт для всех подсистем)

```
service ──(1 tx)──► outbox(event_type, aggregate_id, payload, occurred_at, trace_id)
                          │ relay: FOR UPDATE SKIP LOCKED
                          ▼
                     Kafka/Redpanda  topic = domain.entity.action
        ┌─────────────┬───────────────┬──────────────┬───────────────┐
        ▼             ▼               ▼              ▼               ▼
   acl-projector  search-indexer  realtime-gateway  push-worker   sync-log-writer
   (policy)       (FTS)          (WS/rooms)        (APNs/FCM)    (delta-курсор)
```
Гарантии: at-least-once + идемпотентные потребители; replay по `offset`;
`source_key` в таблицах-источниках для двойной защиты.

### 2.5. Модель доступа (единая на всю систему)

```
subject = {user_id, session, roles[], org_path[], attributes{}}
rule    = (entity_type, operation, scope, effect, condition)   -- как b_crm_role_perms, но типизировано
scope   = owner | opened | category | stage | subtree(org) | custom(JSONPath)
decision= PDP (OpenFGA/Cedar)  →  {effect, policy_version, reasons[]}
enforcement = PEP в репозитории (не в контроллере!) + materialized acl_item для списков
```
Три уровня применения:
1. **Типовой доступ** («может ли читать сделки вообще») — PDP по ролям, кэш 60 с.
2. **Списки** — JOIN к `acl_item` (паттерн `b_crm_access_attr_*`), один JOIN независимо от числа отделов.
3. **Одиночная сущность** — PDP по атрибутам сущности (owner/opened/category/stage), batch-проверка.

Иерархические правила (`свой отдел и подотделы`) разворачиваются в `subject.principals`
**одним запросом к closure-таблице** до генерации SQL (как `RestrictionsByAttributes`).

---

## 3. Матрица Open Source / сторонних библиотек

### 3.1. Ядро и данные

| Задача | Рекомендация | Замена в коробке |
|---|---|---|
| Язык доменного слоя | **Go 1.22+** (или NestJS/Fastify на Node 20) | PHP 8 / Bitrix D7 |
| Реляционная СБД | **PostgreSQL 16** (JSONB, `ltree`, партиции, `SKIP LOCKED`) | MySQL/MSSQL/Oracle ветки |
| Иерархия | **`ltree`** + опционально closure-таблица | `b_hr_structure_node_path`, `LEFT_MARGIN` |
| Миграции | **goose / Atlas / tern** (схема как код, ревью в PR) | `install/db/*.sql` руками + runtime DDL |
| ORM/доступ | **sqlc** (компилируемые запросы) или Squirrel; GORM только для CRUD | Bitrix ORM + ручной `$DB->Query` |
| Типизированные запросы | **pgx/v5** + `pgtype` | `$DB->ForSql` конкатенации |
| Кэш | **Redis 7** (TTL, pub/sub, streams, Lua для атомарных операций) | `CPHPCache`, статические `$cache` |
| Очереди | **NATS JetStream** или Kafka/**Redpanda** | `CAgent`, статические массивы `Pull\Event` |
| CDC/outbox relay | **Debezium** или outbox на `SKIP LOCKED` | отсутствует |
| Workflow | **Temporal** (долгие миграции, SLA) / **River** (pg-backed, простые job) | `CAgent` с ручным планированием |

### 3.2. Доступ и безопасность

| Задача | Рекомендация |
|---|---|
| Policy engine (RBAC/ABAC) | **OpenFGA** (модель «отношений», хорошо ложится на иерархию) или **AWS Cedar** (детерминированный, типизированный, без side-effects) |
| Альтернатива полегче | **Casbin** (Go, гибкие модели, но модель пишется самим) |
| AuthN / SSO | **ory/hydra** или **Keycloak**; короткоживущие access-tokens (15 мин) + refresh |
| Сессии/токены | **golang-jwt** (`exp`, `jti`, `aud`), ротация ключей в **Vault** |
| Подписи webhook'ов | `crypto/hmac` + `subtle.ConstantTimeCompare` + nonce в Redis |
| Валидация входа | **go-playground/validator** / **Zod**; allowlist для имён полей (`^[A-Z_]{4,50}$`) |
| Безопасный fetch URL | собственный `SafeFetcher` по образцу `PublicUrlValidator` (схема, DNS, все адреса публичны, IP pinning) |
| Аудит | append-only таблица/ClickHouse: `who, what, subject, policy_version, trace_id` |
| Секреты | **Vault** / SOPS; никогда не в `option`/`b_option` |

### 3.3. Realtime, чать, поиск

| Задача | Рекомендация |
|---|---|
| WebSocket-шлюз | **Centrifugo** (комнаты, replay, каналы) или свой на **nhooyr.io/websocket** |
| Доставка с replay | **Redis Streams** (cursor per connection) → паттерн дельта-синхронизации `b_im_log` |
| Push (APNs/FCM/HMS) | **Apple push (apns2)**, **firebase-admin**, очередь с ретраями и dead-letter |
| Поиск по чату/CRM | **OpenSearch** (персиковый фильтр) либо **PG FTS** на старте; Meilisearch для мелких объёмов |
| Полнотекст русского | **PG `russian` dictionary** / OpenSearch `snowball` + синонимы |
| Индикаторы/счётчики | материализованные с `pg_cron`-реконсилятором (паттерн `b_im_counter_overflow`) |

### 3.4. Телефония и омниканальность

| Задача | Рекомендация |
|---|---|
| SIP/WebRTC шлюз | **FreeSWITCH** (или **drachtio** + Media) вместо облачного JS-сценария |
| Видео/групповые звонки | **LiveKit** (SFU) |
| IVR/flow | собственный интерпретатор графа (паттерн `EXECUTION_GRAPH`) + DSL в JSON, версионируемый |
| Очереди звонков | **Ari / FreeSWITCH дистрибуция** + наш `DispatchPolicy` |
| Коннекторы мессенджеров | **WhatsApp Cloud API**, **Telegram Bot API**, **VK** — отдельные адаптеры с нормализацией |
| Виджет на сайте | собственный SPA + WebSocket (паттерн `b_imopenlines_livechat` с CSS-фразами) |
| Транскрипция/ASR | **whisper.cpp** / облачный ASR через шлюз (паттерн `b_voximplant_transcript`) |

### 3.5. Наблюдаемость, качество, эксплуатация

| Задача | Рекомендация |
|---|---|
| Трейсинг | **OpenTelemetry** (trace_id сквозь outbox → WS → push) |
| Метрики/алерты | **Prometheus + Grafana**: `policy_decide_duration`, `acl_stale_events`, `queue_position_p95` |
| Логи | **Loki** или ClickHouse; structured JSON, без тела сообщений |
| Нагрузка | **k6**: сценарии «1000-частный чат», «очередь 500 сессий», «выборка 100k сделок под правами» |
| Тесты контрактов | **Testcontainers** (PG+Redis+Kafka), property-based тесты (`fast-check`/`hypothesis`) на политиках |
| Фича-флаги | **Unleash** / `flagsmith` — вместо опций вида `crm_move_observers_...` |
| Релизы | миграции впереди кода (expand→migrate→contract), канареечный выпуск |

---

## 4. План внедрения

### Фаза 0 — Фундамент (4–6 недель)
**Сделать:** identity + org (`org_node`/`ltree`/`org_member`) + policy (PDP + `policy_rule` + `acl_item`
projector) + outbox/relay + Observability + `SafeFetcher` + канонизация подписи webhook'ов.
**Критерии приёмки:**
* выборка «сделки моего отдела и подотделов» — 1 запрос к closure + 1 JOIN к `acl_item`;
* отзыв роли отражается в выборке ≤ 60 с (автотест);
* replay webhook'а отклоняется (тест с повтором того же body/nonce);
* все внешние fetch'и проходят `SafeFetcher` (включая записи звонков).

### Фаза 1 — CRM-ядро (6–8 недель)
**Сделать:** `crm_entity` + `crm_field` + `crm_category`/`crm_stage` (инвариант «одна S» — частичный
уникальный индекс) + Command-слой с транзакциями + timeline/activity (партиции, `source_key`) +
файлы в object storage.
**Критерии приёмки:** ни один `SELE​CT` по сущности не идёт мимо policy-PEP (линт-тест);
создание поля не выполняет DDL; повтор команды idempotentен.

### Фаза 2 — Чат и realtime (6–8 недель)
**Сделать:** `chat/message` с watermark-прочтением, счётчики с overflow, realtime-gateway
(rooms + replay), outbox → push-worker, delta-sync.
**Критерии приёмки:** 1 000-частный чат — 1 строка на сообщение (не 1 000);
reconnect клиента догоняет события без перезахода; падение consumer'а не теряет событие
(проверка kill-тестом).

### Фаза 3 — Контакт-центр (4–6 недель)
**Сделать:** `line`/`line_session` + `session_deadline` + `DispatchPolicy` (атомарный `UPDATE…RETURNING`)
+ адаптеры коннекторов + telephony-webhook (HMAC+nonce) + `call.flow_state`.
**Критерии приёмки:** параллельные 50 сессий не дают перевыброса слотов (k6-тест);
повтор webhook'а не создаёт второй звонок/лид.

### Фаза 4 — Миграция данных и параллельный запуск (постоянно)
**Сделать:** CDC из коробки (Debezium) → новые таблицы; dual-write; сверка (`reconciler` сравнивает
счётчики/ACL); переключение чтения по фича-флагу; откат через переключение обратно.
**Критерии приёмки:** расхождений между источниками 0 по 20 контрольным сущностям;
производительность не хуже коробки на эталонных k6-сценариях.

---

## 5. Чек-лист безопасности перед релизом

1. HMAC-SHA256 + timestamp ±5 мин + nonce на **всех** внешних webhook'ах; `hash_equals` везде.
2. TLS-verification включён в любом HTTP-клиенте (запрет `disableSslVerification` линтером).
3. Токены: `exp ≤ 15 мин`, `jti`, ротация ключей; никаких «вечных» подписанных ссылок.
4. Права: нет параметров `skip_check`; единственный обход — `SYSTEM_ACTOR` + аудит.
5. Policy кэш: TTL ≤ 60 с, версия в ключе, инвалидация по `role.updated`/`membership.changed`.
6. Валидация идентификаторов прав по реестру, **всех** элементов массива.
7. SQL только параметризованный; идентификаторы — через allowlist (`^[A-Z_]{4,50}$`).
8. `SafeFetcher` для любого URL из данных (записи, интеграции, вебхуки).
9. Атомарность: «слот оператора», «ACL сущности», «создание роли» — одна транзакция.
10. Replay-защита идемпотентностью: `UNIQUE(source_key)`, `UNIQUE(provider_call_id)`, `idempotency_key`.
11. Аудит-лог append-only: `who/what/subject/policy_version/trace_id`.
12. Секреты — Vault; никаких `serialize()` настроек в БД.
13. Push/поисковые payload — без тел переписки и токенов в открытом TEXT.
14. Гостевые/системные субъекты — отдельные типы, не «отрицательный id».
15. Регулярный SAST (`gosec`, `semgrep`) + тест на каждый пункт 1–14.

---

## 6. Что не покрыто аудитом (явные риски)

* **Не проверялись экспериментом** выводы о достижимости уязвимостей (replay webhook'а, чужой
  канал в `pull.request/ajax.php`, обход `PublicUrlValidator`); в отчётах они помечены как
  «требует проверки» — до внедрения нужны сценарные тесты.
* **Не аудировались:** `sale`/`catalog` (заказы и товары), `tasks`, `bizproc`, `disk`, `dav`,
  `calendar`, `report`, `rest`-контур, `highloadblock`, `rpa`, `sender`, `mail`, `imbot` —
  при необходимости методология и шаблон отчёта воспроизводимы (файлы `01–04`).
* **Нагрузочные характеристики** (планы запросов на 10⁷–10⁸ строк, поведение closure-таблицы при
  10⁴ узлах, конкурентность realtime-шлюза) требуют бенчмарков на эталонных данных.
* **Стоимость лицензий/облачных аналогов** (телефония, ASR, WhatsApp) не оценивалась.
