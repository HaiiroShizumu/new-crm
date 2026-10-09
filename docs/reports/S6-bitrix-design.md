# S6 — Bitrix24: установка, встраивание, регистрация (спайк, ТОЛЬКО ПРОЕКТ)

**Статус:** проект, код не писался. **Дата:** 2026-10-09. **Исполнитель:** Hermes.
**Источник кода:** `~/SandBox/twenty-dev/new-crm` @ `origin/master 9ffddb1b59` (чтение через `git show`/`git grep`; в `twenty-core` ничего не копировалось).
**Правило (D4):** каждая ссылка на документацию Б24 — URL; без URL утверждение помечено **НЕ ПРОВЕРЕНО**.

---

## D1. Инвентаризация старого кода

**37 файлов** по `git ls-tree -r --name-only origin/master | rg -i 'bitrix|company-tunnel'` — ядро:
`company-tunnel/{controllers,services,commands,utils}/*.ts`, 7 upgrade-команд `2-42`, entity, интеграционные тесты `test/integration/company-tunnel/`, фронт `doc-management/embed/components/{BitrixFullscreenButton,FullCrmButton}.tsx`.

### Таблица эндпоинтов

`@Controller(ApiPath.Bitrix)` → база `ApiPath.Bitrix = 'api/bitrix'` (путь изменился против AUDIT).

| Эндпоинт | Метод | Что принимает | Чему доверяет | Аутентификация | Что создаёт/делает |
|---|---|---|---|---|---|
| `/install` | POST | `BitrixFormBody` (`member_id`, `domain`, `AUTH_ID/access_token`, `REFRESH_ID`, `application_token`) | форме портала + `application_token` | `verifyApplicationToken` (line 171) + `assertRateLimit` | строку `company-tunnel`, привязку пользователя, DNS-провижининг (`company-tunnel-provision` → `regru-dns`) |
| `/install` | GET | query (`application_token` и пр.) | токену | `verifyApplicationToken` (line ~171) | bootstrap-ответ (сама страница установки) |
| `/placement` | POST/GET | `BitrixFormBody` (placement-поля, `member_id`) | токену через `readVerifiedMemberId` | `verifyApplicationToken` (line 349) + rate-limit | отдаёт HTML встраивания; `handlePlacement` (line 294) |
| `/uninstall` | POST | form | токену | `verifyApplicationToken` (line 217) | деактивация/удаление туннеля |
| `/register` | POST | form + portal REST | токену + ответу REST портала | `verifyApplicationToken` (line 306) + rate-limit | пользователя/привязку `company-tunnel-bitrix-user-binding` |
| `/session` | POST | form (`AUTH_ID/access_token`, `member_id`) | **REST API портала** (`readVerifiedMemberId` → `bitrixPortalRestService`) | `verifyApplicationToken` (line 349) + rate-limit | `loginToken` для тихого входа в iframe. **Body email не читается** (коммент. line ~266) |

### Перепроверка находок AUDIT.md по 9ffddb1b59

AUDIT датирован 2026-10-02 (HEAD `d8ed6ab932`); после него есть коммит `fix(bitrix): harden company-tunnel install, tokens, and bindings`. **Часть находок уже исправлена:**

| Находка AUDIT | Статус сейчас | Доказательство |
|---|---|---|
| **C1** `ApiPath.Bitrix` отсутствует → маршруты в корне | ✅ **Исправлено** | `ApiPath.ts:10: Bitrix = 'api/bitrix'` |
| **C3** fail-open токен (`assertApplicationToken` при незаданном конфиге) | ✅ **Исправлено** | `assertApplicationToken` удалён; везде `verifyApplicationToken`: пустой токен → throw; `expectedSecrets.length === 0` → throw (**fail-closed**); сравнение `createHash` + `timingSafeEqual` (константное время) |
| **C3** `/session` выдаёт логин по email (перехват) | ✅ **Исправлено** | идентичность берётся из REST портала (`readVerifiedMemberId`); «The body email is never read» |
| **C3** `/register` перезаписывает пароль существующего | ⚠️ **Частично** | `bitrix-register.service.ts:164` «password hash is intentionally left untouched»; но `newPassword = password ?? randomBytes(24)` (line 153) — при отсутствии пароля генерируется. Контекст «only ever set for users that are invited» (line 66) → существующие не теряют пароль. **Требует проверки на стенде (E3/E4)** |
| **C3** `isEmailAlreadyVerified: true` | ⚠️ **Не в bitrix-пути** | встречается только `auth/services/auth.service.ts:1006,1057` (путь `signUpWithoutWorkspace`, OAuth/SSO). `bitrix-register` зовёт `signInUp`/`signInUpOnExistingWorkspace` без этого флага. **НЕ ПРОВЕРЕНО** на предмет опосредованного вызова |
| **C3** нет guard/rate-limit | ✅ **Исправлено** | `ThrottlerService` + `assertRateLimit(request, endpoint, memberId)` на install/session/register/placement/uninstall |
| **H1** открытый редиркт `https://${tenant}.${frontDomain}` | ❌ **ЖИВ** | `FullCrmButton.tsx:33-34`: только `isNonEmptyString(tenant)`, regex слага нет → `tenant=evil.com/` меняет хост |
| **H2** токены открытым текстом | ⚠️ **Частично** | `application_token` — «enc:v2 envelope» (шифрован, коммент. entity:54); **`accessToken`/`refreshToken` — `@Column({type:'text'})` без признака шифрования (entity:48-52)** |
| **H4** `memberId`/домен извне управляют DNS | ⚠️ **Ужесточён, но не закрыт** | появился `readVerifiedMemberId` + валидация; **глубину валидации домена против `DNS_ROOT_DOMAIN` не проверял — НЕ ПРОВЕРЕНО** |
| AUDIT M6 «ноль тестов для `BitrixHandlersController`…» | ✅ **устарело** | в дереве есть `controllers/__tests__/bitrix-handlers.controller.spec.ts`, `services/__tests__/bitrix-*.spec.ts` (6 шт.), `test/integration/company-tunnel/suites/bitrix-handlers.integration-spec.ts` |

**Вывод D1:** критический контур **существенно укреплён** (fail-closed + constant-time + portal-REST вместо email + rate-limit), но **H1 живёт**, шифрование `access/refresh` токенов и глубина валидации домена не подтверждены. Аудит 2026-10-02 использовать только с этой пометкой.

---

## D2. Модель угроз (STRIDE)

**1. Установка (`POST /install`).** Угроза: **Spoofing** — злоумышленник подделывает запрос установки с чужим `member_id` и получает туннель/привязку на свой домен, либо инициирует DNS-провижининг в чужом контуре. Условие: запрос проходит без корректного `application_token` (например, первый install, когда эталона ещё нет — см. документацию: «эталонное значение приходит в том же запросе»). Последствие: чужой туннель, перехват контура клиента, запись в DNS. Контрмера: fail-closed верификация (уже есть), плюс **подпись самого первого запроса или привязка к предзарегистрированному порталу**; валидация `domain` против `DNS_ROOT_DOMAIN`; отдельный флаг «первичная установка» с одноразовым nonce.

**2. Снятие (`POST /uninstall`).** Угроза: **Repudiation / Spoofing** — документация Б24 прямо говорит: в `ONAPPUNINSTALL` нет auth-данных, «сверка `application_token` — единственный способ убедиться, что вызвал Б24». Условие: токен не совпал/отсутствует, а обработчик всё равно деактивирует. Последствие: удаление туннеля конкурента, отказ в обслуживании (DoS) легитимного клиента. Контрмера: строгий 403 при несовпадении, **никакой частичной обработки**, идемпотентность повторного uninstall, журнал причины в append-only лог.

**3. Placement / сессия (`/placement`, `/session`).** Угроза: **Elevation of Privilege** — получение `loginToken` за другого сотрудника. Условие: токен подлинный, но `AUTH_ID` из запроса не принадлежит сотруднику портала (подстановка). Последствие: полный вход в CRM жертвы. Контрмера: идентичность **только** из REST портала (сделано: `readVerifiedMemberId`), сверка `access_token` против `client_endpoint` вызовом `profile` (рекомендация документации Б24), запрет доверять полям тела.

**4. Регистрация пользователя (`/register`).** Угроза: **Elevation of Privilege + Information Disclosure** — создание/перехват учётной записи, перезапись пароля, авто-верификация email. Условие: `password` отсутствует/подставляется, либо email уже существует у другой учётной записи. Последствие: захват аккаунта, обход подтверждения почты, попадание в чужой workspace. Контрмера: никогда не перезаписывать пароль существующего (уже так), автогенерированный пароль — только для **новой** записи, запрет `isEmailAlreadyVerified` в этом пути (проверить опосредованные вызовы), идентичность = `(portal/member_id, b24_user_id)`, а не email → **E4**.

**5. DNS / туннель-провижининг (`company-tunnel-provision`, `regru-dns`).** Угроза: **Tampering + Info Disclosure** — внешний запрос управляет инфраструктурой: создаёт/удаляет DNS-записи, читает чужие туннели. Условие: `domain`/`memberId` из тела не валидируются против `DNS_ROOT_DOMAIN`, `undeploy` принимает любой `memberId`. Последствие: подмена CNAME → перехват трафика клиента, вывод туннелей из строя, переполнение квот DNS. Контрмера: allow-list доменов, ограничение `memberId` владельцем туннеля в БД, отказ при любом расхождении (fail-closed), rate-limit, **запрет удаления чужого туннеля** + аудит.

*(Общий слой для всех пяти: токены шифровать at-rest, HMAC с timestamp+nonce на webhook, лог действий с причины.)*

---

## D3. План экспериментов (выполняются позже на тестовом портале Б24, даст владелец)

### E1 — iframe: сессия Twenty внутри Б24

- **Цель:** понять, живёт ли авторизованная сессия Twenty во фрейме Б24 при разных политиках cookie.
- **Шаги:** 1) открыть портал Б24 → встроенный фрейм с URL Twenty; 2) повторить при `SameSite=Lax`, `SameSite=None; Secure`, без cookie (передача токена через `postMessage`); 3) проверить в Chrome, Safari, Firefox (Safari — отдельно, ITP).
- **Ожидаемый результат:** вход сохраняется либо работает `postMessage`-вариант.
- **Критерий провала:** любой из браузеров блокирует куки → фрейм показывает логин бесконечно; если так — переходим на токен в `postMessage`.

### E2 — CSP `frame-ancestors`

- **Цель:** список допустимых доменов-хостеров.
- **Шаги:** 1) подтвердить по документации Б24 домены облачных порталов (`*.bitrix24.ru`, коробочные — свой домен) **URL-ссылка обязательна**; 2) выставить `Content-Security-Policy: frame-ancestors <список>`; 3) проверить встраивание для облачного и коробочного.
- **Ожидаемый результат:** облачные порталы встраиваются, посторонние сайты — нет.
- **Критерий провала:** легитимный портал отклонён (список неполон) или внедрён с произвольного домена (список пуст/`*`).
- **Ссылка:** https://apidocs.bitrix24.ru/settings/app-installation/mass-market-apps/installation-master.html (мастер и placement) — **сам список доменов в документации не нашёл → НЕ ПРОВЕРЕНО, нужно подтвердить отдельно.**

### E3 — install: подлинность обратного вызова + идемпотентность

- **Цель:** закрыть угрозу 1 (первичный install без эталона токена).
- **Шаги:** 1) установить приложение на тестовый портал; 2) перехватить запрос `ONAPPINSTALL` и подделать его (повтор от постороннего); 3) проверить, что `verifyApplicationToken` отклоняет до записи/провижининга; 4) повторить install (реинсталляция) — проверить идемпотентность (нет дублей туннелей/пользователей); 5) проверить `BX24.installFinish()` и сценарий мастера.
- **Ожидаемый результат:** подделка → 403; повтор → та же запись, ничего не задублировано.
- **Критерий провала:** подделка принята, либо повтор создаёт вторую сущность/перезаписывает чужую.
- **Ссылки:** https://apidocs.bitrix24.ru/api-reference/events/safe-event-handlers.html , https://apidocs.bitrix24.ru/api-reference/common/events/on-app-install.html

### E4 — привязка пользователя по `(portal, b24UserId)`, а не по email

- **Цель:** закрыть угрозу 4 (перехват по email).
- **Шаги:** 1) зарегистрировать пользователя на портале А с email X; 2) на портале Б зарегистрировать пользователя с тем же email X; 3) проверить, что записи независимы (нет слияния/перехвата); 4) проверить `createSession` при `b24UserId`, которого нет, но email совпадает.
- **Ожидаемый результат:** две независимые записи; сессия не выдаётся по совпадению email.
- **Критерий провала:** аккаунт одного портала доступен из другого.
- **Ссылка:** https://apidocs.bitrix24.ru/api-reference/common/events/on-app-install.html (поля `auth.member_id`, `application_token`)

### E5 — uninstall: что остаётся

- **Цель:** закрыть угрозу 2 и понять остаточный след.
- **Шаги:** 1) снять приложение; 2) зафиксировать: что из `company-tunnel`/пользователей/DNS осталось; 3) повторить uninstall (идемпотентность); 4) попытаться подделать uninstall без токена.
- **Ожидаемый результат:** подделка → 403; после снятия — данные **помечены** (не физически удалены, если нужен аудит) либо чистятся явно; повтор безопасен.
- **Критерий провала:** удаление чужого туннеля по подделке, либо необратимая потеря данных клиента без предупреждения.
- **Ссылка:** https://apidocs.bitrix24.ru/api-reference/events/safe-event-handlers.html («особенно важно проверять токен в `ONAPPUNINSTALL`»)

---

## D4. Источники

| Утверждение | Источник |
|---|---|
| Событие `ONAPPINSTALL`, структура `auth` | https://apidocs.bitrix24.ru/api-reference/common/events/on-app-install.html |
| Проверка подлинности через `application_token` | https://apidocs.bitrix24.ru/api-reference/events/safe-event-handlers.html |
| Callback установки (REST-only) | https://apidocs.bitrix24.ru/settings/app-installation/mass-market-apps/installation-callback.html |
| Мастер установки, `BX24.installFinish()`, `placement.bind` | https://apidocs.bitrix24.ru/settings/app-installation/mass-market-apps/installation-master.html |
| Серверное приложение без UI, «эталон в том же запросе» | https://apidocs.bitrix24.ru/local-integrations/serverside-local-app-with-no-ui.html |
| Список доменов облачных/коробочных порталов для `frame-ancestors` | **НЕ ПРОВЕРЕНО** — URL не найден, нужен отдельный поиск |
| Идемпотентность повторного install в Б24 | **НЕ ПРОВЕРЕНО** — в документации не нашёл; проверяется экспериментом E3 |
| Глубина валидации `domain` против `DNS_ROOT_DOMAIN` в форке | **НЕ ПРОВЕРЕНО** — код `company-tunnel-provision`/`regru-dns` не читал целиком |
| Шифрование `accessToken`/`refreshToken` (entity:48-52) | **НЕ ПРОВЕРЕНО** — `@Column({type:'text'})` без видимого envelope; возможен рантайм-шифрование выше по стеку |
| Поведение `randomBytes(24)` в `/register` для существующих | **НЕ ПРОВЕРЕНО** — нужен прогон E3/E4 |

**Контроль P0:** ни один из кодовых выводов выше не подтверждён прогоном — только чтение `git show`/`git grep`. Статус: **NOT RUN** (стенд Б24 недоступен).
