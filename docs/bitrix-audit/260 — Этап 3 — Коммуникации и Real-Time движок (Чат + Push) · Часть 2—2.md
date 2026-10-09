<!-- bitrix note.document id=260 collectionId=10 updatedAt=2026-10-07T14:34:44+03:00 -->

### 3.4. NOTIFY-поля в таблице сообщений
`b_im_message` несёт `NOTIFY_TYPE/MODULE/EVENT/TAG/SUB_TAG/TITLE/BUTTONS/READ` — данные
уведомлений, не имеющие отношения к самому сообщению, лежат в той же строке, что и текст.
Следствие: индексы по `NOTIFY_TAG` в таблице сообщений, рост строки, смешение двух доменов.

### 3.5. Игнорирование ошибок доставки
```php
// Pull\Event::send()
$executeResult = static::executeEvents();
if (!$executeResult->isSuccess()) {
    foreach ($executeResult->getErrors() as $error) {
        trigger_error("Pull send error; ...", E_USER_WARNING);   // не Result, не лог-сервис
    }
}
...
// executeEvents():
if (!\CPullOptions::GetQueueServerStatus()) { self::$messages = []; return $result; }  // тихо выбросить
...
else { self::sendEventsLegacy(); self::$messages = []; }   // protobuf/legacy: очистка БЕЗ проверки успеха
```
События живут в статическом состоянии процесса: при падении/таймауте фонового job — **теряются
навсегда** (восстановления нет, повторной попытки нет). Для чата это «сообщение видно в БД, но
не долетело в другие вкладки» — рассинхрон, который лечится только перезаходом.

### 3.6. TLS-проверка отключена явно
```php
$httpClient->disableSslVerification();//todo: remove
$httpClient->query($options["method"], $url, $message);
```
(`pull_channel.php`, `SendCommand`). Publish идёт по HTTP(S) без проверки сертификата —
см. §4.2. TODO живёт вместе с кодом, отправляющим все realtime-события.

### 3.7. Состояние ошибок в module option
Счётчик ошибок очереди живёт в `pull.nginx_error` как `serialize([...])` в `b_option`.
При нескольких воркерах/процессах это read-modify-write гонка; при сбросе кэша/опций — потеря
состояния; CAdminNotify создаётся повторно при каждом проходе. Состояние доставки должно быть
в БД/очереди с атомарными инкрементами, а не в настройке модуля.

### 3.8. Push: удаление до отправки
```php
$strSql = $DB->TopSql("SEL​ECT … FR​OM b_pull_push_queue" . $sqlDate, 280);
...
if ($maxId > 0) { $DB->Query("DELETE FR​OM b_pull_push_queue WHERE ID <= " . $maxId); }
$CPushManager = new CPushManager();
foreach ($arPush as $arStack) { $CPushManager->SendMessage($arStack); }
```
Любой сбой в `SendMessage` (exception, таймаут, рестарт) = пушей больше нет. Для пушей это
допустимая бизнес-потеря, но паттерн «сначала удали, потом отправь» в общем виде — антипаттерн;
нужен статус строки (`pending → sent/failed`) и ретраи.

### 3.9. Промежуточные таблицы с избыточными индексами
`b_im_message_unread` — 8 индексов, `b_im_relation` — 9, `b_im_recent` — 9.
Ряды индексов покрывают противоположные порядки (`(STATUS,COUNTER)` и `(CHAT_ID,LAST_SEND_MESSAGE_ID)`),
что указывает на «индекс под каждый медленный запрос» (см. этап 2, 702 индекса в crm).

### 3.10. Флаги обхода прав в конфигурации операции
`SendingConfig::skipUserCheck()`, `convertMode()`, `WAIT_FULL_EXECUTION`, `SKIP_ACCESS_CHECK='Y'`
в списках чатов, `NOT_CHECK_PERMISSIONS`/`DisableEventsCheck` в long-poll endpoint.
Тот же антипаттерн, что и `disableCheckAccess()` в CRM (этап 2, §4.1): **обход проверки —
это параметр вызова**, а не отдельный системный актор.

### 3.11. Устаревший формат сообщения: две колонки текста
`MESSAGE` и `MESSAGE_OUT` (HTML для «исходящего» вида) + `EMAIL_TEMPLATE` в той же таблице.
Хранение двух (а фактически трёх) представлений текста в строке — утечка абстракции
«представление ↔ данные»; современный дизайн хранит канонический текст, форматирование — на рендере.

### 3.12. Неполные/расходящиеся индексы под реальные запросы
`b_im_event_log` покрыта только одноколоночными `IX(USER_ID)` и `IX(DATE_CREATE)`: запрос вида
`WHERE USER_ID=? ORDER BY DATE_CREATE, ID LIMIT n` (тот же паттерн, что в `SyncService`)
потребует сортировки после отбора по пользователю. На `b_im_log` составной индекс есть —
два близких лога спроектированы по-разному.

---

## 4. Анализ безопасности и Уязвимостей (Security Audit)

### 4.1. Публичный long-poll endpoint
`pull/install/components/bitrix/pull.request/ajax.php`:
```php
define("PUBLIC_AJAX_MODE", true);
define("NOT_CHECK_PERMISSIONS", true);
define("DisableEventsCheck", true);
require_once(... "/bitrix/modules/main/include/prolog_before.php");
...
$userId = intval($USER->GetID());           // или LoginByCookies(), или отрицательный SESS_GUEST_ID
if (check_bitrix_sessid()) { … CPullStack::Get($_POST['CHANNEL_ID'], …) }
```
Риски и защиты: действует `check_bitrix_sessid()` (CSRF), аутентификация — куки-сессия.
**Но**: `CHANNEL_ID` берётся из `$_POST` — при запросе с валидным sessid и каналом другого пользователя
`CPullStack::Get()` отдаст события чужого канала, если только сам канал не подписан и не проверяется
на принадлежность. В этом файле такой проверки нет (`CHANNEL_ID` используется напрямую).
**Требует проверки**: матчинг `CHANNEL_ID` → `b_pull_channel.USER_ID` на стороне PULL-режима.

### 4.2. Отключение проверки TLS при публикации событий
```php
$httpClient->disableSslVerification();//todo: remove
```
В комбинации с подписью канала (`signature` только в shared-режиме) это допускает MITM между PHP
и очередью-сервером: подмена/подслушивание событий (в них — тексты сообщений, счётчики, id).
Подпись не покрывает private-каналы в publish-запросе. Фикс: включить проверку сертификата,
подписывать **каждое** publish-сообщение (не только shared), верифицировать на сервере очереди.

### 4.3. Обход прав на отправку в чат
```php
if (!$messageObject->isSystem() && !$config->convertMode() && !$config->skipUserCheck()
    && $messageObject->getAuthorId() && !$chat->canDo(Action::Send)) { … отказ … }
```
Любой вызывающий, установивший `skipUserCheck`/`convertMode` или приславший `MESSAGE_TYPE='S'`,
проходит мимо `canDo`. Системные сообщения — легитимный случай, но «перевод в системный тип»
находится в данных запроса. Нужна явная авторизация на создание system-сообщений
(например, `SYSTEM_ACTOR`-контекст, как в этапе 2 §5.5).

### 4.4. Содержимое push в открытой очереди
`b_pull_push_queue.MESSAGE/PARAMS` — `TEXT` без шифрования: текст уведомления, имя чата и бейдж
лежат в БД в открытом виде и в `b_pull_push` — `DEVICE_TOKEN` устройств. Любая SQL-инъекция или
утечка дампа = пуш-токены и содержимое переписки. Рекомендация: хранить только ссылку/сжатый
плейлоад, токены — шифровать на уровне приложения.

### 4.5. Ретраи и идемпотентность на границах
Позитив: `b_im_message_uuid` закрывает дубли при ретраях клиента, `multiplyInsertWithoutDuplicate`
+ `UNIQUE(USER_ID,CHAT_ID,MESSAGE_ID)` закрывают гонки параллельного прочтения.
Негатив: отсутствие транзакции между `$message->save()` (синхронно) и вставкой unread-строк
(в фоне): при падении фона сообщение есть, непрочитанность — нет (счётчик занижен, не завышен:
fail-closed для бейджа, но «прочитано не появится» до переоткрытия).

### 4.6. Гости и отрицательные id
`$userId = intval($_SESSION["SESS_GUEST_ID"]) * -1` — гости живут в отрицательном диапазоне id.
Любая логика, сравнивающая `USER_ID > 0` или джойнящая `b_user` без учёта знака, либо
`getUserIdsFromChannels()` в publish-пути, потенциально обрабатывает гостей некорректно.
**Требует проверки:** типовые места `intval($_POST['USER_ID'])` без нижней границы.

### 4.7. Что проверено и что нет
Подтверждено чтением кода: схемы, пайплайны отправки/доставки/прочтения, отсутствие ретраев в
publish, `disableSslVerification`, порядок `DELETE → SEND` в push-агенте, обходы `skipUserCheck`,
гостевые id, схема `b_pull_*`.
**Не проверено экспериментом:** реальная принадлежность `CHANNEL_ID` в `pull.request/ajax.php`
(нужен запрос с чужим каналом), фактическое поведение при обрыве фонового job, нагрузочные
характеристики `b_im_message_unread` на объёмах 10⁷+, фактический TLS-трафик publish.

---

## 5. Спецификация для Новой CRM (Target Architecture)

### 5.1. Схема базы данных: чат и прочтение

Принцип: **не хранить строку на каждое непрочитанное сообщение** — хранить watermark прочтения
и считать разницу; при необходимости материализовать счётчик.

```sql
CREATE TABLE chat (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind         TEXT NOT NULL,               -- 'direct','group','channel','thread','system'
    parent_id    BIGINT REFERENCES chat(id),  -- ветки/комментарии (бывший PARENT_ID/MID)
    title        TEXT, color TEXT,
    entity_type  TEXT, entity_id TEXT,        -- привязка к CRM-сущности (stage 2)
    entity_data  JSONB NOT NULL DEFAULT '{}',
    last_message_id BIGINT,
    created_by   BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    disappearing_interval INTERVAL,
    settings     JSONB NOT NULL DEFAULT '{}'  -- MANAGE_*/CAN_POST как правила, не колонки
);
CREATE INDEX chat_entity_idx ON chat (entity_type, entity_id);
CREATE INDEX chat_parent_idx ON chat (parent_id);

CREATE TABLE chat_member (
    chat_id    BIGINT NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL,
    role       TEXT   NOT NULL DEFAULT 'member',   -- 'owner','manager','member','guest'
    permissions JSONB NOT NULL DEFAULT '{}',       -- переопределения (ex-b_im_permission)
    last_read_message_id BIGINT NOT NULL DEFAULT 0,  -- WATERMARK: всё <= считается прочитанным
    last_read_at TIMESTAMPTZ,
    is_muted   BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden  BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX chat_member_user_idx ON chat_member (user_id, chat_id);

CREATE TABLE message (
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    chat_id    BIGINT NOT NULL,
    author_id  BIGINT NOT NULL,
    kind       TEXT NOT NULL DEFAULT 'user',    -- 'user','system','service'
    body       TEXT NOT NULL,                   -- канонический текст (одно представление)
    body_format TEXT NOT NULL DEFAULT 'text',   -- 'text','html','markdown'
    metadata   JSONB NOT NULL DEFAULT '{}',     -- NOTIFY_*, параметры, ссылки
    idempotency_key UUID,                       -- ex-b_im_message_uuid
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at  TIMESTAMPTZ, deleted_at TIMESTAMPTZ,
    PRIMARY KEY (id, created_at)                -- для партиционирования
) PARTITION BY RANGE (created_at);
-- партиции помесячно; UNIQUE(idempotency_key) глобально через отдельную таблица-дедупликатор
CREATE UNIQUE INDEX message_idem_uq ON message (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX message_chat_idx ON message (chat_id, id DESC) WHERE deleted_at IS NULL;

CREATE TABLE message_reaction (message_id BIGINT, user_id BIGINT, emoji TEXT, created_at timestamptz,
    PRIMARY KEY (message_id, user_id, emoji));

-- счётчик прочтения: бейдж = COUNT(message WHERE id > last_read_message_id AND author<>me)
-- чтобы не считать на каждый запрос: материализованный счётчик, обновляемый триггером/воркером
CREATE TABLE chat_member_counter (
    chat_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
    unread_count INT NOT NULL DEFAULT 0,
    unread_is_muted INT NOT NULL DEFAULT 0,
    overflow BOOLEAN NOT NULL DEFAULT FALSE,    -- ex-b_im_counter_overflow
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX chat_member_counter_badge_idx ON chat_member_counter (user_id) WH​ERE unread_count > 0;

CREATE TABLE chat_search (chat_id BIGINT PRIMARY KEY, title TEXT, document tsvector);
CREATE TABLE message_search (message_id BIGINT PRIMARY KEY, document tsvector);
```

### 5.2. Realtime-шлюз и доставка

```
                       ┌──────────────────────────────────────────┐
   REST / WS ─────────►│  realtime-gateway (Go)                   │
                       │  - аутентификация по JWT, подпись комнаты │
                       │  - подписка: chat:{id}, user:{id}, tag:{x}│
                       │  - cursor per connection (replay)         │
                       └───────┬──────────────────────┬───────────┘
                               │ SUBSCRIBE            │ PUBLISH
                        ┌──────▼──────┐        ┌──────▼──────┐
                        │ Redis Pub/Sub│        │ Redis Streams│  at-least-once + replay
                        │ (fan-out)   │        │ (персистент) │
                        └──────▲──────┘        └──────▲──────┘
                               │                       │
   API-сервисы ── write ──►  outbox (таблица) ─relay──►│
                               │ (в одной транзакции с записью)
                               ▼
                        push-worker → APNs/FCM/HMS (retry + backoff + dead-letter)
```
Ключевые свойства:
1. **Событие рождается в outbox** в той же транзакции, что и запись (`message`, `chat_member.last_read…`) —
   нет «сохранил, а push потерялся».
2. Relay публикует в Redis Stream с `id`-курсором: клиент при reconnect шлёт `last_event_id`,
   шлюз отдаёт пропущенное (replay) — вместо «перезайди, чтобы догнать».
3. Теговые комнаты (`chat:{id}`) дают один publish на чат вместо N по участникам — прямая замена
   `IM_PUBLIC_*` + `b_pull_watch`, но с явной TTL-подпиской на стороне шлюза.
4. Подпись канала = одноразовый `room_token` с `exp` и `chat_id` в claims (вместо HMAC от строки).

### 5.3. Схема фоновых воркеров

| Воркер | Технология | Задача |
|---|---|---|
| `outbox-relay` | Go, `FOR UPDATE SKIP LOCKED` → Redis Streams | гарантированная доставка событий |
| `counter-projector` | consumer | `message.created` → `chat_member_counter` batch-increment; `read` → пересчёт watermark |
| `search-indexer` | consumer | `message.*` → `message_search` (TSVECTOR) / OpenSearch |
| `push-worker` | consumer с retry (exp backoff, max 5, dead-letter) | APNs/FCM; статус строки `pending/sent/failed` |
| `sync-log-writer` | consumer | дельта-карта `sync_log` с retention (4 недели) — ex `b_im_log` |
| `janitor` | pg_cron | чистка `sync_log`, гостевых каналов, протухших подписок (ex 32 мин), исчезающих сообщений |
| `backfill-recent` | job с курсором и `IS_LOCKED` (ex `b_im_recent_init_queue`) | ленивая инициализация «Недавних» для больших историй |

### 5.4. Контракты API

```yaml
# REST
POST /v1/chats/{id}/messages   {body, idempotency_key} → 201 {id, created_at}
GET  /v1/chats/{id}/messages?before_id=&limit=50 → {items[], next_before_id}
POST /v1/chats/{id}/read       {up_to_message_id} → {unread_count:0}
GET  /v1/sync?cursor=&limit=200 → {changes:[{entity_type, entity_id, event}], cursor, has_more}
GET  /v1/badges                → {total, by_chat:{...}, overflow:[chat_id]}

# WebSocket
→ {"op":"subscribe","rooms":["chat:123","user:42"],"last_event_id":"…"}
← {"event":"message.created","room":"chat:123","seq":8912,"data":{...}}
← {"event":"message.read","room":"chat:123","data":{"user_id":7,"up_to":8910}}
→ {"op":"ping"}  ← {"op":"pong","server_time":"…"}     # 10 c, как в pull
```

### 5.5. Матрица замен

| Велосипед Bitrix (этап 3) | Замена |
|---|---|
| `b_im_message_unread` (строка на непрочитанное) | watermark `last_read_message_id` + материализованный счётчик |
| `b_im_message_viewed` | отдельная таблица «viewed by» только там, где нужна видимость «увидел» (диалоги), иначе watermark |
| `pull` publish через HTTP + `disableSslVerification` | WebSocket/HTTP2 шлюз с TLS verify + подпись room-token |
| `b_pull_stack` + PHP long-polling fallback | Redis Streams + replay-курсор (fallback не нужен) |
| `Bitrix\Pull\Event` (статика процесса + фон) | outbox + relay (переживает падение процесса) |
| `b_pull_watch` с TTL 32 мин | подписки в Redis с TTL + явный heartbeat |
| `CPullPush::SendAgent` (DELETE до отправки) | очередь с `status` и ретраями, dead-letter |
| `pull.nginx_error` в module option | метрики (Prometheus) + счётчик в Redis |
| `CIMMessenger::Add` 134 КБ | `SendMessageUseCase` + domain services (validation/permission/side-effects) |
| `MESSAGE` + `MESSAGE_OUT` | один канонический `body` + `body_format`, рендер на клиенте |
| `b_im_permission` (10 колонок) | `permissions JSONB` на участнике + наследование от `settings` чата |
| `b_im_log` upsert + keyset | та же схема (это удачное решение) с партиционированием по времени |
| FULLTEXT включается миграцией | поисковый индекс как отдельный сервис, включение — фича-флаг в каталоге |

### 5.6. Чек-лист этапа 3

1. Идемпотентность на каждой команде записи (`idempotency_key`), ретраи безопасны.
2. События — только через outbox; «сохранил + отправил» обязано быть одной транзакцией.
3. Непрочитанное — watermark + счётчик, никогда O(N×M) строк.
4. Publish подписывается и идёт по TLS с проверкой сертификата.
5. Никаких `skip_check`-флагов: обход прав = отдельный системный контекст с аудитом.
6. Replay по курсору: клиент после reconnect догоняет сам, без «перезайди».
7. Push-очередь с состояниями и ретраями; секреты (токены, тексты) не в открытом TEXT.
8. Классы ≤ ~1 000 строк; легаси-фасады удаляются в том же релизе, где появились.
