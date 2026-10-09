<!-- bitrix note.document id=222 collectionId=10 updatedAt=2026-10-07T14:34:42+03:00 -->

# Этап 3 — Коммуникации и Real-Time движок (Чат + Push)
### Аудит: `im` (хранилище, доставка, счётчики, синхронизация) и `pull` (каналы, транспорты, push)

> Источник: `/home/bitrix/www/bitrix/modules/{im,pull}`.
> Масштаб по замеру: `im` — **69 таблиц / 153 индекса** в `install/migrations/tables.php`,
> `lib/` — 1 247 PHP-файлов (из них `lib/V2/` — новая архитектура), классы-гиганты:
> `im_messenger.php` 134 КБ, `im_chat.php` 89 КБ, `im_message.php` 42 КБ, `im_history.php` 36 КБ.
> `pull` — 5 таблиц (`install/db/mysql/install.sql`), 62 файла в `lib/`.

---

## 1. Архитектурный разбор и Поток данных (Data Flow)

### 1.1. Две эпохи внутри одного модуля

| Слой | Где | Стиль |
|---|---|---|
| **Легаси** | `im/classes/general/*` (`CIMChat`, `CIMMessenger`, `CIMMessage`, `CIMHistory`) + `im/lib/model/*` (62 ORM-модели) | статические методы, `global $APPLICATION/$DB`, исключения через `ThrowException` |
| **V2** | `im/lib/V2/*` (~800 файлов): `Chat`, `Message`, `Relation`, `Reading`, `Recent`, `Sync`, `Pull`, `Folder`, `Anchor`, `Cache`, `Async` | контекст (`ContextCustomer`), `Result`-объекты, сервис-локатор, Promise |
| **Мост** | `V2/Service/*`, `V2/Common/MigrationStatusCheckerTrait`, десятки `@deprecated`-фасадов в `CounterService` и др. | легаси-метод делегирует в V2 |

`Bitrix\Im\V2\Message` (`lib/V2/Message.php`, класс на 55+ интерфейсов: `ActiveRecord, RestEntity,
AccessCheckable, ChatActionAccessCheckable, ChatHolder, DateFilterable, PopupDataAggregatable…`)
— центральная сущность, уже не «строка таблицы», а доменный объект.

### 1.2. Схема базы данных (ключевые таблицы, реальный DDL)

```sql
b_im_chat (ID, PARENT_ID, PARENT_MID, TITLE, DESCRIPTION, COLOR, TYPE CHAR(1), EXTRANET,
  AUTHOR_ID, AVATAR, PIN_MESSAGE_ID, CALL_TYPE, CALL_NUMBER,
  ENTITY_TYPE(50), ENTITY_ID(255), ENTITY_DATA_1..3,      -- привязка к CRM/задачам/дискам
  DISK_FOLDER_ID, MESSAGE_COUNT, USER_COUNT,
  PREV_MESSAGE_ID, LAST_MESSAGE_ID, LAST_MESSAGE_STATUS(50), DATE_CREATE,
  MANAGE_USERS, MANAGE_USERS_ADD, MANAGE_USERS_DELETE, MANAGE_UI, MANAGE_SETTINGS,
  DISAPPEARING_TIME, CAN_POST)                             -- уровень доступа строкой: MEMBER|MANAGER|OWNER
  + IX(AUTHOR_ID,TYPE), (ENTITY_TYPE,ENTITY_ID,AUTHOR_ID), (CALL_NUMBER,AUTHOR_ID),
    (TYPE), (PARENT_ID,PARENT_MID), (AVATAR)

b_im_message (ID, CHAT_ID, AUTHOR_ID, MESSAGE TEXT, MESSAGE_OUT TEXT, DATE_CREATE,
  EMAIL_TEMPLATE, NOTIFY_TYPE, NOTIFY_MODULE, NOTIFY_EVENT, NOTIFY_TAG, NOTIFY_SUB_TAG,
  NOTIFY_TITLE, NOTIFY_BUTTONS, NOTIFY_READ, IMPORT_ID)
  + IX(NOTIFY_TAG,AUTHOR_ID), (NOTIFY_SUB_TAG,AUTHOR_ID), (CHAT_ID,NOTIFY_READ),
    (CHAT_ID,DATE_CREATE), (NOTIFY_TYPE,DATE_CREATE), (AUTHOR_ID,CHAT_ID)

b_im_relation (ID, CHAT_ID, MESSAGE_TYPE, USER_ID, START_ID, UNREAD_ID, LAST_ID,
  LAST_SEND_ID, LAST_FILE_ID, LAST_READ, STATUS, CALL_STATUS, MESSAGE_STATUS,
  NOTIFY_BLOCK, MANAGER, COUNTER, START_COUNTER, LAST_SEND_MESSAGE_ID, REASON, IS_HIDDEN)
  + 9 индексов: (USER_ID,MESSAGE_TYPE,STATUS), (USER_ID,MESSAGE_TYPE,CHAT_ID),
    (USER_ID,STATUS), (MESSAGE_TYPE,STATUS), (CHAT_ID,USER_ID), (STATUS,COUNTER),
    (USER_ID,CHAT_ID), (CHAT_ID,LAST_SEND_MESSAGE_ID)

b_im_message_unread (ID, USER_ID, CHAT_ID, MESSAGE_ID, IS_MUTED, CHAT_TYPE,
  DATE_CREATE, PARENT_ID)   -- ОДНА СТРОКА НА КАЖДОЕ НЕПРОЧИТАННОЕ СООБЩЕНИЕ ДЛЯ КАЖДОГО ЮЗЕРА
  + UNIQUE(USER_ID,CHAT_ID,MESSAGE_ID) + 8 индексов

b_im_message_viewed (ID, USER_ID, CHAT_ID, MESSAGE_ID, DATE_CREATE)
  + UNIQUE(USER_ID,CHAT_ID,MESSAGE_ID) + 4 индекса

b_im_last_message (ID, USER_ID, CHAT_ID, MESSAGE_ID, DATE_CREATE) + UNIQUE(CHAT_ID,USER_ID)
b_im_recent (USER_ID, ITEM_TYPE, ITEM_ID, ITEM_MID, ITEM_CID, ITEM_RID, ITEM_OLID,
  PINNED, UNREAD, DATE_MESSAGE, DATE_UPDATE, MARKED_ID, PIN_SORT, DATE_LAST_ACTIVITY,
  PREVIEW_SOURCE_CID, PREVIEW_SOURCE_MID) + PK(USER_ID,ITEM_TYPE,ITEM_ID) + 9 индексов
b_im_message_index (MESSAGE_ID PK, SEARCH_CONTENT MEDIUMTEXT) + FULLTEXT
b_im_chat_index     (CHAT_ID PK, SEARCH_CONTENT MEDIUMTEXT, SEARCH_TITLE(511)) + 2 FULLTEXT + IX(SEARCH_TITLE)
b_im_log (ID, USER_ID, ENTITY_TYPE, ENTITY_ID, EVENT, DATE_CREATE, DATE_DELETE)
  + UNIQUE(USER_ID, ENTITY_TYPE, ENTITY_ID) + IX(USER_ID, DATE_CREATE)   -- дельта-синхронизация
b_im_event_log (ID, USER_ID, EVENT_TYPE, EVENT_DATA LONGTEXT, DATE_CREATE) + IX(USER_ID), IX(DATE_CREATE)
b_im_counter_overflow (ID, USER_ID, CHAT_ID) + UNIQUE(CHAT_ID,USER_ID)
b_im_permission (ID, CHAT_ID, USER_ID, DATE_CREATE, AUTHOR_ID,
  PERM_USER_PROMOTE/CHAT_INFO/USER_ADD/USER_REMOVE/MESSAGE_SEND/MESSAGE_EDIT/
  MESSAGE_DELETE/MESSAGE_RICH/MESSAGE_PIN/MESSAGE_POLL  -- 10 колонок CHAR(1))
b_im_anchor, b_im_reaction, b_im_message_favorite, b_im_message_param (EAV параметров),
b_im_sharing_link(+_member), b_im_folder(+_chat,_pin), b_im_recent_init_queue, b_im_call(+_user)
```

Схема `pull` (`pull/install/db/mysql/install.sql`):

```sql
b_pull_stack  (ID, CHANNEL_ID varchar(50), MESSAGE text, DATE_CREATE) + IX(CHANNEL_ID), IX(DATE_CREATE)
b_pull_channel(ID, USER_ID, CHANNEL_TYPE, CHANNEL_ID, CHANNEL_PUBLIC_ID, LAST_ID, DATE_CREATE)
               + UNIQUE(USER_ID, CHANNEL_TYPE), IX(CHANNEL_ID), IX(CHANNEL_PUBLIC_ID)
b_pull_watch  (ID, USER_ID, CHANNEL_ID, TAG, DATE_CREATE) + IX(USER_ID,TAG), IX(DATE_CREATE), IX(TAG)
b_pull_push   (ID, USER_ID, DEVICE_TYPE, APP_ID, UNIQUE_HASH, DEVICE_ID, DEVICE_NAME,
               DEVICE_TOKEN, VOIP_TYPE, VOIP_TOKEN, DATE_CREATE, DATE_AUTH) -- токены устройств
b_pull_push_queue(ID, USER_ID, TAG, SUB_TAG, MESSAGE text, PARAMS text, ADVANCED_PARAMS text,
               BADGE, DATE_CREATE, APP_ID) + IX(USER_ID,TAG), (USER_ID,SUB_TAG), (DATE_CREATE), (APP_ID)
```

### 1.3. Жизненный цикл отправки сообщения

```
POST /rest/im.message.add (V2 Controller)  или  CIMMessenger::Add($arFields)
 └─ CIMMessenger::Add()  [im_messenger.php:127]
      ├─ getMessageObject / SendingConfig($arFields)
      ├─ ПРАВА: $chat->canDo(Permission\Action::Send)   (системные/convertMode/skipUserCheck — в обход)
      └─ $chat->sendMessage($message, $config)          [V2/Chat.php:655]
           ├─ prepareMessage()
           ├─ SendingService::checkDuplicateByUuid()   ← ИДЕМПОТЕНТНОСТЬ: TEMPLATE_ID = UUID
           │      └─ уже существует → вернуть существующий message_id (ретрай клиента безопасен)
           ├─ fireEventBeforeSend()  ← обработчик может ПЕРЕНАПРАВИТЬ в другой чат
           ├─ isCompletelyEmpty() → EMPTY_MESSAGE
           ├─ uploadFileFromText()
           ├─ $message->save()                      ← СИНХРОННАЯ ЗАПИСЬ (b_im_message + b_im_message_param)
           └─ BackgroundJobPromise::deferJob(onAfterMessageSend)   ← ОТЛОЖЕННЫЕ ЭФФЕКТЫ
                return SendResult{messageId, promise}
 └─ CIMMessenger::Add: if (WAIT_FULL_EXECUTION === 'Y') $promise->wait();   // дождаться фона

onAfterMessageSend()  [V2/Chat.php:823]  (в фоновом job):
   updateMessageUuid        → закрыть окно идемпотентности
   processMessageAnalytics  → аналитика (mention_all и т.п.)
   updateStateAfterMessageSend → LAST_MESSAGE_ID / MESSAGE_COUNT в чате, b_im_recent
   MentionService::onMessageSend
   updateCountersAfterMessageSend → CountersUpdater::addForUsers()
        └─ MessageUnreadTable::multiplyInsertWithoutDuplicate([rows × участникам]) + инвалидация кэша
   updateParentStateAfterMessageSend (ветки/комментарии → PARENT_ID в unread)
   PushService::sendPush($counters)                → CPullPush → b_pull_push_queue
   fireEventAfterMessageSend → Bitrix\Pull\Event::add(...)   (realtime-события в память)
   LinkFacade::saveLinksFromMessage                → b_im_link_url/file/task/calendar
   transcribeFilesAfterMessageSend                 → AI-транскрипция (1 файл за раз)
```

Фоновый штат: `V2/Async\Queue` — собственный in-process Promise-очередь, которая
**одним** `Application::addBackgroundJob(fn() => $this->runInBackground())` выносит все
отложенные эффекты за ответ; если код уже выполняется в фоне (`isInBackground`), промис
выполняется немедленно (`immediateIfBackground`). Вызывающий может синхронно дождаться через
`Queue::wait($promise)` — тогда фон «сворачивается» обратно в текущий запрос.

### 1.4. Жизненный цикл realtime-доставки (pull)

```
Bitrix\Pull\Event::add($recipients, $params)   [pull/lib/event.php:22]
  ├─ валидация module_id, проверка UTF-8 (Common::findInvalidUnicodeSymbols)
  ├─ getEntitiesByType(): recipients = user id | Channel entity | 32-символьный channel id
  ├─ накопление в СТАТИЧЕСКИХ массивах: self::$messages / $deferredMessages / $push
  └─ (для публичных чатов) Tag-канал: CPullWatch::AddToStack('IM_PUBLIC_<chatId>', …) → b_pull_watch

… конец HTTP-запроса …
Pull\Event::onAfterEpilog() → scheduleSending()
  └─ Application::addBackgroundJob([Event::class,'sendInBackground'], [], JOB_PRIORITY_LOW)

sendInBackground() → send() → executeEvents():
  ├─ если очередь-сервер ВЫКЛ  → self::$messages = []        ← события просто отбрасываются
  ├─ fillChannels(): user id → b_pull_channel.CHANNEL_ID
  ├─ JsonRpcTransport  → batch JSON-RPC 2.0 (isJsonRpcUsed)
  ├─ ProtobufTransport → бинарный batch (isProtobufUsed)
  └─ legacy: CPullChannel::Send(channels, json, options)
        └─ SendCommand(): HttpClient POST publishUrl, timeout=5, dont_wait_answer,
           + заголовок Message-Expiry, + параметр signature (HMAC) для shared-режима,
           + $httpClient->disableSslVerification()   ← см. §4
        └─ разбивка по CPullOptions::GetCommandPerHit() каналов на один hit
        └─ при ошибке: счётчик в module option `pull.nginx_error`, ≥10 → CAdminNotify, return false
executePushEvents() → CPullPush → b_pull_push_queue
```

**Каналы:** `CPullChannel::Get(userId)` — приватный канал юзера, `GetShared()` — общий канал
(режим `pull.server_mode = shared|personal`), теговые каналы `IM_PUBLIC_<chatId>` / `IM_PUBLIC_COMMENT_<parentId>`.
`SignChannel()` подписывает идентификатор канала HMAC-ключом (`pull.signature_key`) — клиент не может
подключиться к каналу, не зная ключа.

**Клиент** (`pull/install/js/pull/client/pull.client.js`): `LONG_POLLING_TIMEOUT = 60 c`,
`PING_TIMEOUT = 10 c`, восстановление WebSocket через `RESTORE_WEBSOCKET_TIMEOUT = 30 мин`,
периодическая проверка конфига (`checkConfig`), детект offline. Конфиг выдаёт
`CPullChannel::GetConfig()` (`pull_channel.php:865`): `CHANNEL_ID` (подписанные private+shared),
`PATH` (long-poll), `PATH_WS` (websocket), `PATH_PUB` (publish), `METHOD: LONG|PULL`.
**Fallback без очереди-сервера:** `/bitrix/components/bitrix/pull.request/ajax.php` — PHP long-polling,
который отдаёт `CPullStack::Get(CHANNEL_ID, lastId)` из `b_pull_stack` и обновляет `LAST_ID` в
`b_pull_channel`.

### 1.5. Прочтение и счётчики

```
V2\Reading\Reader::readTo / readExactly / readAllInChat / readAll / readAllByRecentSection
  ├─ обновление b_im_relation.LAST_READ / UNREAD_ID
  ├─ удаление строк b_im_message_unread (CountersUpdater::delete() → ScopeStep)
  ├─ инвалидация CountersCache по юзеру
  └─ sendPullReadMessages / sendEventReadMessages → Pull\Event (вкладки/устройства узнают мгновенно)

Счётчики (V2\Reading\Counter\UserCountersCollector::get):
  1) кэш CountersCache (user) → попал
  2) иначе: SEL​ECT COUNT(*), MAX(MESSAGE_ID) FR​OM b_im_message_unread
            WHERE USER_ID=? GROUP BY CHAT_ID ORDER BY MAX(MESSAGE_ID) DESC LIMIT 1000
  3) чаты с переполнением → b_im_counter_overflow (значение = CounterOverflowService::getOverflowValue())
  4) обогащение деревом чатов (PARENT_ID) и секциями recent → UserCounters
  5) запись в кэш
```
Плюс `b_im_last_message (CHAT_ID, USER_ID)` — «последнее прочитанное/последнее сообщение» на юзера.

### 1.6. Дельта-синхронизация вкладок/устройств

```
V2\Sync\Logger::add($event, $userId)      // накопление в памяти
   └─ addDeferred(): LogTable::multiplyMerge(...)  // batch upsert
        b_im_log UNIQUE(USER_ID, ENTITY_TYPE, ENTITY_ID) → ОДНА строка на сущность на юзера
        (событие перетирается, DATE_CREATE обновляется)   + retention 4 недели (1 день для OL/комментариев)

Клиент: GET …?lastDate=&lastId=&limit=
SyncService::getChangesFromDate():
   fetchRowsByUserId(user) + fetchRowsByUserId(0 /*глобальные*/)
   → keyset-пагинация по (DATE_CREATE, ID):  DATE_CREATE > ? OR (DATE_CREATE = ? AND ID > ?)
   → двухпроходный merge O(n) и срезка по limit (комментарий ALG-01: курсор берётся из ПОСЛЕДНЕЙ строки)
   → клиент получает список изменившихся (ENTITY_TYPE, ENTITY_ID) и перезапрашивает их
```
Это **не** append-only журнал: это «карта последнего изменения», поэтому объём ограничен числом
сущностей, а не числом событий.

### 1.7. Мобильный push

```
CPullPush::Add / prepareSend → b_pull_push_queue (сохранение MESSAGE/PARAMS/BADGE/TAG)
CPullPush::SendAgent():
   - ждёт DATE_CREATE < now-15 сек (коалесцирование)
   - SELECT … TOP 280
   - группирует по 10 → CPushManager::SendMessage($stack)
   - DELETE FR​OM b_pull_push_queue WH​ERE ID <= maxId   ← ДО отправки (см. §3/§4)
   - само-перепланирование: если осталось >280 → через 10 c, >0 → через 30 c
Токены устройств: b_pull_push (UNIQUE_HASH = user+app, DEVICE_TOKEN, VOIP_*), чистка cleanTokens()
Сервисы: pull/lib/push/service/{apple,applevoip,firebaseandroid,google,googleinteractive,huaweipushkit}
```

### 1.8. Права внутри чата

Двухуровневая модель:
1. **Уровень чата** — колонки `b_im_chat.MANAGE_*` и `CAN_POST` со значениями `MEMBER|MANAGER|OWNER`
   (строка-уровень, а не булевы флаги);
2. **Персональные переопределения** — `b_im_permission` (10 колонок `PERM_*` на пару CHAT_ID+USER_ID);
3. **Проверка** — `Chat::canDo(Permission\Action::Send)` (`V2/Permission/{Action,ActionGroup,Filter,GlobalAction}`).

Обходы в отправке: `SendingConfig::skipUserCheck()`, `convertMode()`, `isSystem()` — см. §4.

### 1.9. Поиск

`b_im_message_index` / `b_im_chat_index` — отдельные FULLTEXT-таблицы (как `SEARCH_CONTENT` в CRM).
Включение индекса — миграционным кодом (`lib/update/messageindex.php:104` →
`enableFullTextIndex('SEARCH_CONTENT')`). Поведение `Bitrix\Im\Chat::getListParams()`:
* если FULLTEXT включён → `prepareStringToken()` + `canUseFulltextSearch()`; при слишком коротком/шумном
  запросе функция возвращает `null` → **результат «ничего не найдено»**;
* иначе → `LIKE 'find%'` по `SEARCH_TITLE` с минимум 3 символами.
Доступ: JOIN `RELATION.USER_ID` (участник чата) либо флаг `FILTER[SKIP_ACCESS_CHECK] = 'Y'`.

---

## 2. Удачные решения (What to Keep / Patterns to Adopt)

### 2.1. Идемпотентность отправки по UUID
`SendingService::checkDuplicateByUuid()` + `b_im_message_uuid`: клиент шлёт `TEMPLATE_ID` (UUID),
сервер при повторе возвращает уже созданный `message_id` (и умеет «продлевать» срок, если запись ещё
не создана). Это **exactly-once на стороне прикладного API** поверх at-least-once транспорта.
Переносим дословно: `idempotency_key` в каждой команде записи.

### 2.2. Синхронная запись + отложенные побочные эффекты
Разделение на «сохрани и сразу ответь» (`$message->save()`) и «потом разгреби»
(`BackgroundJobPromise::deferJob`) даёт низкую латентность при сохранении и при этом
сохраняет возможность синхронно дождаться эффектов (`WAIT_FULL_EXECUTION`), когда это критично
(например, REST-интеграции нужен посчитанный счётчик). In-process `Async\Queue` с одним
background-job — дешёвая замена очереди сообщений внутри одного запроса.

### 2.3. Батчинг realtime-событий в памяти запроса
`Pull\Event` не шлёт по одному: события копятся в статических массивах, отправляются **после**
формирования ответа (`onAfterEpilog`) одним батчем по транспорту (JSON-RPC / Protobuf / HTTP).
Один HTTP-запрос с 50 событиями = одна publish-операция. Паттерн «collect → flush after response»
переносится в outbox + батчер.

### 2.4. Теговые (публичные) каналы вместо fan-out по приватным
`IM_PUBLIC_<chatId>` / `IM_PUBLIC_COMMENT_<parentId>` + `b_pull_watch (USER_ID, TAG, DATE_CREATE)`:
для публичного чата событие пишется **один раз** в тег, а подписчики определяются по `b_pull_watch`
(с очисткой «протухших» подписок старше 32 минут — `DELETE … DATE_CREATE < now-32min`).
Вместо N приватных publish — 1. Ключевой приём против fan-out взрыва.

### 2.5. Коалесцирование непрочитанных и overflow-защита
`b_im_message_unread` + `b_im_counter_overflow`: счётчик считается `COUNT(*) GROUP BY CHAT_ID` c
`LIMIT 1000`, а переполненные чаты выносятся в отдельную таблицу с фиксированным значением —
интерфейс показывает «1000+», не считая миллионы строк. Отличный приём для любых badge-счётчиков.

### 2.6. Дельта-синхронизация через upsert-карту изменений
`b_im_log` c `UNIQUE(USER_ID, ENTITY_TYPE, ENTITY_ID)` + keyset-курсор `(DATE_CREATE, ID)` +
двухпроходный merge отсортированных источников — это канонический «маленький» протокол синхронизации:
объём ответа ограничен числом изменившихся сущностей, курсор стабилен при одинаковых timestamp'ах
(строгое `ID > lastId` против бесконечной пагинации), merge O(n) вместо `usort` O(n log n).
Авторы явно зафиксировали инварианты комментарием `ALG-01`.

### 2.7. Batch-вставки и защита от дедлоков
`MultiplyInsertTrait::multiplyMultiply/insertSelect/multiplyMerge` (upsert одним `INSERT … SELECT`),
`prepareFieldsToMinimizeDeadlocks` (сортировка строк по ключу перед вставкой),
`DeadlockResolver`, `InsertSelectTrait` для «прочитал-вставил» без выгрузки в PHP.
Каждая операция с непрочитанными — `multiplyInsertWithoutDuplicate`, а не цикл INSERT.

### 2.8. Отдельные поисковые таблицы с включаемым FULLTEXT
Поиск не грузит основную таблицу сообщений: `b_im_message_index` (PK = MESSAGE_ID) обновляется
отдельно, FULLTEXT включается миграцией, а при его отсутствии есть деградация в `LIKE`.
Разделение «данные ↔ индекс» позволяет переезжать на внешний движок поиска без изменения домена.

### 2.9. Двухрежимность сервера и честный fallback
`pull.server_mode = shared|personal`, `GetQueueServerStatus()`, `GetWebSocketStatus()` и
`METHOD: LONG|PULL` — если очереди нет, клиент честно переходит на PHP long-polling
(`pull.request/ajax.php`), а не ломается. Приём для поэтапного внедрения инфраструктуры.

### 2.10. Иерархия чатов для свёртки счётчиков
`b_im_message_unread.PARENT_ID` (ветки/комментарии/каналы) + `ChatTreeResolver` + `RecentTable` —
позволяет свернуть счётчики дочерних чатов в бейдж родителя и не «поднимать» счётчик невидимого
родителя (`removeOrphaned()`, флаг скрытого родителя). Продуманная деталь, редко реализуемая правильно.

---

## 3. Антипаттерны и Архитектурные тупики (What NOT to Do)

### 3.1. Классы-гиганты и глобальное состояние
`im_messenger.php` — **134 КБ** статических методов (отправка, редактирование, реакции, команды ботов,
десктоп-статусы, лимиты звонков — в одном файле), `im_chat.php` — 89 КБ.
Внутри — `$GLOBALS["APPLICATION"]->ThrowException(...)`, `global $DB`, возврат `false|string|int`
вперемешку. Тестируемость и переиспользование близки к нулю.

### 3.2. Две архитектуры, живущие одновременно
`CIMMessenger::Add()` — это `if (MESSAGE_TYPE !== 'S') { V2-путь } else { 200 строк легаси-массажа полей}`.
Плюс `MigrationStatusCheckerTrait`, `CounterServiceLegacy`, `CounterService` (каждый метод —
`@deprecated`-делегат), `Pull\...Legacy`. Каждый новый фич-код вынужден решать: «куда писать».
Классический итог больших экосистем: **миграция, которая никогда не заканчивается**.

### 3.3. Хранилище «непрочитанного» как O(участники × сообщения)
Каждое сообщение в группе из 1 000 человек создаёт **1 000 строк** `b_im_message_unread`
(`CountersUpdater::addForUsers` → `multiplyInsertWithoutDuplicate`). Показ сообщения пользователю
пишет ещё по строке в `b_im_message_viewed` (`Reading\View\ViewUpdater::add`, bulk + `DEADLOCK_SAFE`)
и **дополнительно** сохраняет денормализованный флаг на самой строке сообщения
(`$messagesToView->setViewedByOthers()->save(true)`). Плюс 8 индексов на unread-таблице —
вставка одного сообщения = 8 индексных операций × участники. Это главный write-amplification
узел мессенджера. Масштабируется до определённого порога, дальше — только партиционированием
или переходом на watermark (см. §5).

