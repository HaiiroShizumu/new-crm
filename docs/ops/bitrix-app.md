# Канал Битрикс24: карточка приложения в кабинете вендора

Памятка оператору: что вписать в карточку приложения в маркетплейсе Битрикс24 и что для этого
настроить на стороне инстанса. Основание — `docs/adr/ADR-015-bitrix-channel.md` и код
`packages/twenty-server/src/modules/smb-bitrix/`. Чего в этих источниках нет, здесь тоже нет.

`<корень>` — корень инстанса, значение `SERVER_URL` из `/opt/crm/{staging,prod}/.env`
(например `https://app.example.com`). Все адреса ниже — POST.

## 1. Что понадобится заранее

Тиражное (не локальное) приложение Б24 с OAuth-клиентом: `client_id` и `client_secret`.
Без них канал выключен — сервер отвечает `503` c кодом `NOT_CONFIGURED`
(`modules/smb-bitrix/services/smb-bitrix-oauth.service.ts`). Локальное приложение Б24 этим
каналом не обслуживается (ADR-015, «Последствия»).

## 2. Адреса в карточке приложения

| Поле карточки | Значение |
|---|---|
| Адрес приложения | `https://<корень>/webhooks/smb-bitrix/app` |
| Адрес установки | `https://<корень>/webhooks/smb-bitrix/install` |
| Обработчик событий | `https://<корень>/webhooks/smb-bitrix/event` — подписывать `ONAPPINSTALL` и `ONAPPUNINSTALL` |

Префикс `webhooks/` штатный (`ApiPath.Webhooks`), модуль лежит под ним:
`SMB_BITRIX_ROUTE_PREFIX = webhooks/smb-bitrix`
(`smb-bitrix/constants/smb-bitrix-route-prefix.constant.ts`).

Что делает каждый адрес (`modules/smb-bitrix/controllers/smb-bitrix.controller.ts`):

- `POST …/install` — установка на портал. Принимает только администратор портала
  (`isCurrentPersonAdmin`, иначе `ADMIN_REQUIRED`), создаёт/обновляет строку портала, запускает
  фоновую синхронизацию сотрудников (до 2000 активных).
- `POST …/app` — открытие приложения: обменяет `REFRESH_ID` на токены, подпишет сотрудника в его
  workspace и ответит `303` на `<сабдомен>/verify?loginToken=…&returnToPath=/docflow`.
- `POST …/event` — события: `ONAPPINSTALL` сохраняет `application_token` (один раз, не
  перезаписывается), `ONAPPUNINSTALL` сверяет его и помечает портал `UNINSTALLED`. Прочие события
  код не обрабатывает и отвечает `{ ok: true }`.

Доказательство каждого запроса — обмен `REFRESH_ID` на `oauth.bitrix.info` с нашим
`client_secret`; поддельный `member_id` в теле ни на что не влияет (ADR-015, п.2).

## 3. Права доступа

Права приложения: **`user`**. Этого хватает и для чтения сотрудников при установке, и для входа.

Установку должен запускать администратор портала: код дополнительно требует `user.admin`
(`ADMIN_REQUIRED`, ADR-015, п.10). Сотрудник без `email` в профиле Б24 в приложение не войдёт
(ADR-015, «Последствия»).

## 4. Переменные на сервере

В `/opt/crm/{staging,prod}/.env` (см. `smb/deploy/.env.example`):

```
SMB_BITRIX_CLIENT_ID=<client_id из кабинета вендора>
SMB_BITRIX_CLIENT_SECRET=<client_secret оттуда же>
SMB_BITRIX_AUTO_PROVISION_WORKSPACE=        # true — компания создаётся при установке, см. §5
```

Обе строки `SMB_BITRIX_*` обязательны вместе: пустое значение сервер считает незаданным, а частично
заданная пара валит старт с ошибкой `Bitrix24 is partially configured`
(`smb-config/utils/parse-smb-env.util.ts:41-52,82-85`).

После правки `.env` значения подхватываются только при пересоздании контейнеров. Вручную, тем же
вызовом, что у `smb/deploy/bin/deploy.sh:47-48`:

```bash
docker compose --project-directory /opt/crm/<env> \
  -f /opt/crm/<env>/docker-compose.yml --env-file /opt/crm/<env>/.env up -d
```

Очередной деплой (`deploy.sh`) делает это сам; как копируется `.env` из `.env.example` —
`docs/ops/deploy.md`, §5 «`.env` per env».

## 5. Установка и статус портала

Статусы портала: `PENDING → ACTIVE → UNINSTALLED` (`smb.bitrixPortal.status`,
`types/smb-bitrix-portal-status.type.ts`).

- Новый портал создаётся со статусом `PENDING` (значение по умолчанию в миграции `bitrix/0001`).
- `SMB_BITRIX_AUTO_PROVISION_WORKSPACE` по умолчанию выключен (ADR-015, п.11). Без флага даже корректная установка не
  создаёт компанию: страница установки отвечает «готовим вашу рабочую область», портал остаётся
  `PENDING` (`smb-bitrix-launch.service.ts:55-65`, `return { isActive: false }`).
- **Пока портал `PENDING`, открытие приложения отвечает `PORTAL_NOT_ACTIVE`** («установлено и
  ждёт активации»): сотрудников в компанию ещё не пускают.
- Активация — только привязкой к workspace, см. §6. Активная установка/повторная установка даёт
  `ACTIVE` (`markReinstalled`), удаление с портала — `UNINSTALLED` с обнулением токенов, при этом
  аккаунты и привязки сохраняются, повторная установка возвращает ту же компанию (ADR-015, п.12).

### Автоматическое создание компании

С `SMB_BITRIX_AUTO_PROVISION_WORKSPACE=true` установка приложения сама создаёт компанию: аккаунт
установившего, workspace на сабдомене из домена портала, схему компании в базе, затем аккаунты
сотрудников портала (`smb-bitrix-launch.service.ts`, `install` и `provisionWorkspace`). Используются
штатные `signUpOnNewWorkspace` и `activateWorkspace`, поэтому действуют ограничения ядра:

| Ограничение ядра | Что сделать |
|---|---|
| Создавать компании могут только администраторы сервера (`IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS`, по умолчанию `true`) | поставить `false` в `.env`. Иначе создаётся только самая первая компания на пустом сервере, остальные порталы остаются `PENDING` с ошибкой `Workspace creation is restricted to admins` |
| Не больше 5 компаний на сервер без Enterprise-ключа | шестой портал остаётся `PENDING`; константа не правится |
| У компании свой сабдомен | DNS `*.<корень>` и wildcard-сертификат, `docs/ops/deploy.md` §6 |

Значение `false` в первой строке открывает создание компаний и на публичной странице регистрации:
любой, кто знает адрес сервера, может занять одно из пяти мест. Поэтому в `.env.example` строка
закомментирована, включает её владелец на конкретном сервере.

Если создание не удалось, установка не падает: портал остаётся `PENDING`, причина лежит в
`smb.bitrixPortal.lastError` и в логе сервера, дальше работает ручная привязка из §6.

## 6. Привязка портала к компании (когда флаг выключен)

Портал в статусе `PENDING` привязывает оператор командой:

```bash
node dist/command/command smb:bitrix:bind-portal --member-id <id портала> --workspace-id <uuid>
```

Команда лежит в `packages/twenty-server/src/modules/smb-bitrix/commands/`,
`member_id` виден в теле запроса установки и в логе сервера. Привязка ставит `ACTIVE`
(`SmbBitrixPortalService.bindToWorkspace`) и разрешает домену портала встраивать компанию во фрейм.
После этого `/app` начинает пускать сотрудников; аккаунт каждому создаётся при первом открытии
приложения (массовая синхронизация идёт только при установке).

## 7. Проверка, что адреса живы

Без тела/с `member_id` вместо `refresh_token` любой из трёх адресов отвечает HTML со статусом
`403` (`INVALID_REQUEST`), с `refresh_token`, но без `SMB_BITRIX_*` — `503` (`NOT_CONFIGURED`):
так проверено на стенде 2026-10-13. Идти дальше имеет смысл только с живым порталом Б24.

## Ссылки

- `docs/adr/ADR-015-bitrix-channel.md` — решения по каналу.
- `docs/adr/ADR-008-instance-topology-b24-gateway.md` — шлюз: при нескольких серверах адреса в
  карточке указывают на шлюз, а не на инстанс (шлюз пока не написан, ADR-015, «Поправка 2026-10-13»).
- `docs/README.md` §5 — сценарий установки целиком.
- `TODO.md` — что осталось проверить на живом портале.
