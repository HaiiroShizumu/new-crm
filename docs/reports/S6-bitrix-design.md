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
| **H2** токены открытым текстом | ✅ **Исправлено** (E2) | `@Column({type:'text'})` без transformer — шифрование в сервисе перед записью: `company-tunnel-provision.service.ts:70-72,77-80` → `encryptOptional()` → `encryptToken()` (envelope `enc:v2` = `SECRET_ENCRYPTION_ENVELOPE_PREFIX`); чтение — `bitrix-portal-rest.service.ts:84 decryptTokenOrNull(tunnel.accessToken)`; модуль `SecretEncryptionModule` подключён в `company-tunnel.module.ts:18` |
| **H4** `memberId`/домен извне управляют DNS | ⚠️ **Ужесточён, allow-list суффиксов нет** (E1) | `provision()`: домен → `normalizeBitrixPortalDomain` (только regex DNS-формы) → `throw` при невалидном (fail-closed), **но суффиксового allow-list нет**; `undeploy(memberId)` → `findOne({memberId})` — трогает только найденный туннель, однако не сверяет право вызывающего на memberId (см. E1); `regru-dns.service.ts:69` — `DNS_ROOT_DOMAIN` **опционален** с хардкод-дефолтом `'crm-systems-ai.ru'` (**M7 из AUDIT жив**), используется как `dname` базовой зоны (имя записи строится от корня → вражеский domain в DNS-имя не попадает; точное формирование `sub` — **НЕ ПРОВЕРЕНО**) |
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

**6. Фальшивый портал (дополнение E6).** Угроза: **Spoofing + SSRF** — запрос приходит от «портала», который на самом деле не Битрикс24, либо домен в туннеле перенаправлен на чужой сервер. Условие: `normalizeBitrixPortalDomain` (`utils/normalize-bitrix-portal-domain.util.ts:7-8`) принимает **любой синтаксически валидный DNS-хост — суффиксового allow-list (`.bitrix24.ru` / коробочные домены) нет**; `secure-http-client/.../resolve-and-validate-hostname.util.ts:20-26` блокирует только **внутренние IP** (loopback/RFC1918), наружу — не ограничивает. Последствие: `assertPortalClaim`/REST-вызовы уходят на подконтрольный сервер → подделка claim → первый install без эталона токена (см. E4), утечка `access_token` чужому хосту. Контрмеры: **REST-проверка только на домены из белого списка** (суффиксы `bitrix24.ru`, `bitrix24.com` + явный список коробочных доменов клиента — подтвердить документацией); **динамический `frame-ancestors`** по подтверждённому домену клиента (а не общий список); **решение по коробочным порталам вынести в «Вопросы владельцу»** — их домены произвольны, и статический allow-list их не покроет.

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

## D3.1. Дочитывание кода (E1–E5, E7) — только чтение, `git show`/`git grep`

### E1 — `company-tunnel-provision` / `regru-dns`: валидация перед DNS

- `provision()`: `services/company-tunnel-provision.service.ts:51` → `normalizeBitrixPortalDomain(input.domain)`; `:53-55` — `throw 'Invalid Bitrix DOMAIN'` при `null` (**fail-closed**). `resolveTenantSlug()` (`:150-167`) дополнительно требует непустой slug и его же regex.
- **Allow-list против `DNS_ROOT_DOMAIN` — НЕТ.** `DNS_ROOT_DOMAIN` встречается ровно в двух местах: `services/regru-dns.service.ts:69` и объявление `config-variables.ts:2006`. Используется как `dname` базовой зоны Reg.ru (`:19` — `dname: rootDomain`), **опционален**: `get('DNS_ROOT_DOMAIN') || 'crm-systems-ai.ru'` → хардкод-дефолт (**M7 AUDIT жив**).
- **`undeploy(memberId)` (`:123-125`)**: `findOne({ where: { memberId } })` → удаляет **только найденный** туннель (чужой memberId просто не находит). Но **сверки «вызывающий имеет право на этот memberId» внутри нет** — ограничение идёт только через `verifyApplicationToken` в контроллере. Потеря токена = возможность снести свой/чужой туннель.
- **Вердикт E1:** fail-closed валидация есть; **allow-list суффиксов нет**; `undeploy` адресативен по memberId, но полагается на токен снаружи.

### E2 — шифрование `accessToken`/`refreshToken` (entity:48-52)

**Шифруются.** В entity — голый `@Column({type:'text'})` **без transformer** (поэтому в аннотации entity шифрование не видно), но шифрование происходит в сервисе перед записью:

- запись: `services/company-tunnel-provision.service.ts:70-72` (create) и `:77-80` (update) → `this.encryptOptional(...)` → `:191-196` `companyTunnelTokenService.encryptToken(value)`;
- чтение: `services/bitrix-portal-rest.service.ts:84` → `decryptTokenOrNull(tunnel.accessToken)`;
- модуль подключён: `company-tunnel.module.ts:18` `SecretEncryptionModule`;
- формат: envelope `enc:v2` = `SECRET_ENCRYPTION_ENVELOPE_PREFIX` (`secret-encryption/constants/secret-encryption.constant.ts`); миграция старых значений — `2-42-instance-command-slow-1791289438350-encrypt-company-tunnel-tokens.ts`.

**Вердикт E2: H2 из AUDIT закрыт** — `accessToken`, `refreshToken`, `applicationToken` хранятся в `enc:v2`.

### E3 — `bitrix-portal-rest`: куда уходят запросы (SSRF)

- **URL:** `services/bitrix-portal-rest.service.ts:308` — `` const url = `https://${hostname}/rest/${method}` ``; hostname из `:74` `normalizeBitrixPortalDomain(tunnel.bitrixDomain)` — **из сохранённой строки туннеля в БД, а не из тела запроса**; `:76-78` — `throw 'Stored Bitrix portal domain is not a valid hostname'`.
- **Сетевая защита:** `:9-10` `SecureHttpClientService` + `resolveAndValidateHostname`; `secure-http-client/utils/resolve-and-validate-hostname.util.ts:20-26` — резолв и блокировка **внутренних IP** (`Connection to internal IP address … is not allowed`).
- **Allow-list доменов Б24 — НЕТ:** regex `normalize-bitrix-portal-domain.util.ts:7-8` = `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$` — «любой валидный DNS-хост».
- **Вердикт E3:** запрос уходит на домен из БД (не из запроса) + блок internal-IP; **но белого списка суффиксов нет** → см. угрозу 6 в D2.

### E4 — первый install без эталонного `application_token`

Порядок в `POST /install` (`bitrix-handlers.controller.ts`, offset от строки 69):

1. `:~17` `assertRateLimit(request, 'install', memberId)` — ключ включает `member_id` **и `request.ip`** (комментарий: за обратным прокси нужен `TRUST_PROXY`);
2. обязательны `member_id`, `DOMAIN`, `AUTH_ID`, `application_token` (иначе throw);
3. **`:~41` `await this.bitrixPortalRestService.assertPortalClaim({ memberId, … })` — доказательство подлинности портала ДО сравнения токена** (REST-вызов к порталу с присланным `access_token`);
4. `:~48` `tryVerifyApplicationToken({ memberId, … })` → `tokenMatches`;
5. комментарий кода: *«Mismatch is allowed only after portal claim proof: first install without a stored/global match, or reinstall with a rotated secret»*;
6. при `!tokenMatches` обработка продолжается **только потому, что claim уже доказан**, затем `provision(...)`.

**Вердикт E4:** «эталон» для первого install — **не хранимое значение, а живой REST-proof** (`assertPortalClaim`). Что мешает постороннему `POST /install`: (1) rate-limit по ip+member_id, (2) обязательность `application_token`, (3) необходимость предъявить рабочий `access_token` реального портала Б24. Остаточный риск: украденный/утёкший `access_token` проходит; **повторный install с ротацией токена перезаписывает сохранённый** (комментарий п.5) — проверить E3-экспериментом.

### E5 — что между `d8ed6ab932` и `9ffddb1b59` (по логу, без прогона typecheck)

```
$ git log --oneline d8ed6ab932..9ffddb1b59 | wc -l
6
9ffddb1b59 docs: audit notes
0d93acff9b test
d883a67ae5 fix(bitrix): harden company-tunnel install, tokens, and bindings
331b129067 chore: merge smb/crm-custom into master
838043caa2 feat(smb): add liquid-glass skin, ui-preferences, and navigation customizations
b07b23cef3 feat(smb): add messenger, doc-management, and CRM shell customizations
```

Какой коммит трогал файлы находок AUDIT (C1/C2/C4/H3):

| Коммит | Файлы находок |
|---|---|
| `b07b23cef3` | `twenty-shared/src/types/ApiPath.ts` (**C1**), `twenty-config/config-variables.ts` (**C2**), `doc-management/embed/…DocManagementEmbedAuthGate.tsx`, `…FullCrmButton.tsx` (**C4**), `workspace-migration-builder/…/validate-flat-view-update.util.ts` (**H3**) |
| `0d93acff9b` ("test") | снова `ApiPath.ts`, `config-variables.ts` + **9 файлов `doc-management/embed/**`** — включая восстановленные `useDocManagementEmbedMode.ts`, `withDocManagementEmbedParam.ts` (именно их удаление и давало битые импорты C4) |
| `838043caa2`, `331b129067`, `d883a67ae5`, `9ffddb1b59` | этих файлов не трогали |

**Вердикт E5 (по логу, без запуска):** C1/C2 правились в `b07b23cef3` и `0d93acff9b`; **C4 (битые импорты embed-модулей) — `0d93acff9b` возвращает удалённые модули**, т.е. по составу файлов typecheck, вероятно, починен; `d883a67ae5` (harden) добавил 37 файлов контура и тесты, но к находкам C1/C2/C4 отношения не имеет. **Прогон `tsgo` не выполнялся (NOT RUN, память/правило P0) — окончательный вердикт только по прогону.**

### E7 — исправление открытого редиректа H1 (описание, код не правим)

Сейчас (`packages/twenty-front/src/modules/doc-management/embed/components/FullCrmButton.tsx:33-34`):

```ts
const workspaceUrl =
  isNonEmptyString(tenant) && isNonEmptyString(frontDomain)
    ? `https://${tenant}.${frontDomain}`
    : window.location.origin;
```

`tenant` берётся из query и вставляется в хостовую часть URL без проверки — `?tenant=evil.com/` (со слэшем) меняет хост (открытый редирект).

Предлагаемое исправление (три независимых барьера, применить все):

1. **Regex слага** — `tenant` обязан быть одиночным DNS-лейблом (тот же паттерн, что уже есть в форке у `portal-slug-from-bitrix-domain.util.ts`):
   ```ts
   const TENANT_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
   const safeTenant = TENANT_SLUG_RE.test(tenant) ? tenant : null;
   ```
   Слэш, точка, `@`, `:` — не проходят → интерполяция невозможна.
2. **Конструирование через `new URL` + сравнение хоста** (не строковой конкатенацией):
   ```ts
   const url = new URL(`https://${safeTenant}.${frontDomain}`);
   const expectedHost = `${safeTenant}.${frontDomain}`;
   if (url.host !== expectedHost || url.username || url.password || url.search || url.hash) → fallback на window.location.origin;
   ```
   `new URL` кинет исключение на невалидном хосте и нормализует `.`/кодировку — сравнение host ловит подмену.
3. **Allow-list `frontDomain`** — `domainConfiguration.frontDomain` должен проверяться против ожидаемого суффикса инстанса (`.crm-systems-ai.ru` и т.п.), а не приниматься как есть.

Критерий проверки: `?tenant=evil.com/`, `?tenant=evil.com`, `?tenant=--x`, `?tenant=a%2Fb.evil.com` — все дают `window.location.origin`; рабочий слаг — корректный поддомен. Прогон — экспериментом, отдельно от этого описания.

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
| URL REST-вызовов и allow-list доменов | **ПРОВЕРЕНО (E3)** — домен из БД туннеля, regex без суффиксов, блок internal-IP; белого списка нет → угроза 6 (D2) |
| Идемпотентность повторного install в Б24 | **НЕ ПРОВЕРЕНО** — в документации не нашёл; проверяется экспериментом E3 |
| Валидация `domain` в provision/DNS | **ПРОВЕРЕНО (E1)** — regex DNS-формы + fail-closed; allow-list суффиксов нет; `DNS_ROOT_DOMAIN` опционален с дефолтом `crm-systems-ai.ru` (см. D3.1) |
| Шифрование `accessToken`/`refreshToken` | **ПРОВЕРЕНО (E2) — шифруются**: `encryptOptional()` в provision.service:70-80, чтение `decryptTokenOrNull` (portal-rest:84), `enc:v2` |
| Поведение `randomBytes(24)` в `/register` для существующих | **НЕ ПРОВЕРЕНО** — нужен прогон E3/E4 |

**Контроль P0:** ни один из кодовых выводов выше не подтверждён прогоном — только чтение `git show`/`git grep`. Статус: **NOT RUN** (стенд Б24 недоступен).
