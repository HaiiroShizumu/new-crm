# ПЛАН: форк Twenty (smb-CRM) — сборка продукта без ломки ядра

**Статус:** v2 — пересобран по замечаниям Sonnet от 2026-10-09 (см. `docs/REPORT-01-otvet-hermes.md`; общий контекст — `docs/CONTEXT-LOG.md`). К исполнителю НЕ передавать до прохождения Этапа 0.5 (спайки A2/S1–S5).
**Исполнитель:** Sonnet (Claude Code) в `/Users/haiiro/SandBox/twenty-core`
**Дата:** 2026-10-09

---

## 0. Источники и что из них берём

| Источник | Что берём | Что НЕ берём |
|---|---|---|
| `SandBox/twenty-core` | Рабочий форк: база `twenty/v2.45.6`, реестр `docs/PATCHES.md`, CI-гейт `check-core-patches`, 7 ADR (`docs/adr/`), baseline-анализ `docs/arch/00-baseline-analysis.md`, правила агентов `CLAUDE.md` (раздел «Форк») | — (это основа) |
| `SandBox/new-crm` | **Только визуал smb-skin** (компоненты Smb* + темы twenty-ui) и накопленный опыт аудита (`AUDIT.md` — список ошибок, которых мы НЕ повторяем) | Код модулей company-tunnel/doc-management/messenger на v2.42.6 — не переносим (см. §2.2) |
| **`docs/bitrix-audit/`** (перенесён из `agent-harnesses/note-document-212`) | Аудит Битрикс24: что копируем (задачи, комментарии, права, BPM), что отвергаем (D7-монолит, слабая типизация данных), целевой blueprint и этапность | — |
| ECC (перенесён: `ECC/`, `.claude/`, `.cursor/`, `scripts/lib|hooks`) | Многоагентные роли: planner → code-architect → code-reviewer → security-reviewer → e2e-runner; хуки quality-gate; santa-loop для контроля. Скиллы Hermes глобальны (`~/.hermes/skills`) — папка не нужна | — |

---

## 1. Текущее состояние проекта

### 1.1 twenty-core (основной репозиторий, рабочая база)

- **База форка:** тег `twenty/v2.45.6` (коммит `6007ad5a7f`), remote `upstream` = twentyhq/twenty (полное зеркало, push отключён), `origin` = github HaiiroShizumu/new-crm.
- **Уже сделано и работает:**
  - `docs/PATCHES.md` — реестр правок ядра (сейчас 1 строка: P-001, раздел «Форк» в CLAUDE.md). Правило: наш код только в `packages/smb-*`, `apps/`, `docs/`, `scripts/`, `smb/`; всё остальное = строка в реестре, >1 строки = + ADR.
  - CI `fork-ci.yaml` + `scripts/check-core-patches.sh` — падает на любой правке ядра без строки в реестре; ветка `upstream-base` = база для `nx affected`.
  - 7 ADR в `docs/adr/`, все в статусе «Предложено».
  - `docs/arch/00-baseline-analysis.md` — аудит кодовой базы: штатные точки расширения, churn-карта (коммитов upstream/6мес), топ-10 опасных зон.
  - `docs/dev/local-env.md`, `docs/ops/{deploy,backup-restore,migration-policy}.md`.
  - Правила агентов в `CLAUDE.md`/`AGENTS.md` (симлинк): house rules Twenty, команды, gotchas (twenty-shared/dist, Nx-кэш, locales/*.po, upgrade-команды).
- **Ещё НЕ сделано (нет кода):** `packages/smb-*` не существуют, `apps/` нет, визуала нет, все ADR не утверждены, швы P-002/P-003 не внесены в реестр.
- **Фактическое состояние (проверено 2026-10-09):** dev-стек **поднят** — `bash smb/dev/up.sh --lite` (Node 24 через nvm), фронт http://localhost:3001 → 200 `<title>Twenty</title>`, API http://localhost:3000 → `/graphql` 200, `/healthz` ok, db/redis healthy; без worker.

### 1.2 new-crm (старый форк, v2.42.6) — почему НЕ переносим код

По `AUDIT.md` (2026-10-02): ветка `smb/crm-custom`, 452 файла отклонений, +17k строк, и:

- **C1–C4 критично:** битый typecheck (сломан фронт и сервер), `ApiPath.Bitrix` отсутствует → маршруты в корне, 12 незадекларированных ключей конфига, fail-open токен Bitrix → `/session` выдаёт логин по одному email (перехват аккаунта), `isEmailAlreadyVerified: true`.
- **H1–H4:** открытый редирект, токены открытым текстом, правка внутренностей апстрима, DNS/Tunnel-provisioning снаружи.
- Ветка не запушена, HEAD не собирается.

**Вывод:** модули старого форка переносим только после ревизии, как референс логики; визуал — переносим сразу (§5); деплой-обвязка `smb/` старого форка — не переносится (в twenty-core уже своя `smb/dev`, `smb/deploy`).

### 1.3 Модель продукта — приложение в маркетплейсе Битрикс24 (задача владельца, 2026-10-09)

> ⚠️ **ТРЕБУЕТ ПОДТВЕРЖДЕНИЯ ВЛАДЕЛЬЦА: «разворот» или «канал»?**
> От ответа зависит и архитектура поставки, и порядок модулей (§Этап 3):
> - **Разворачивается** — ставится полная CRM на сабдомен клиента (как описано ниже),
>   Б24 показывает её через встраивание в iframe;
> - **Канал** — CRM одна у нас, Б24 лишь туннелирует к ней документооборот портала,
>   без отдельного инстанса на клиента.
> До подтверждения текст ниже — рабочая гипотеза; спайки D (S6) к ней привязаны.

Продукт = **приложение в маркетплейсе Б24, ставится только документооборот**. Механика:

1. Пользователь ставит приложение из маркетплейса → **разворачивается полная CRM** на его сабдомене, с тоннелями (мультиарендность — `company-tunnel` из аудита старого форка).
2. **Внутри Б24 показывается документооборот, относящийся к их порталу Twenty.** Свой домен у клиента в Б24 быть не может — один домен у всех (политика Б24), поэтому роутинг идёт по параметрам портала, а не по хосту.
3. **Регистрация в Twenty — автоматическая, через Битру** (обход по другим параметрам), без ручного логина.

**Следствия (это критический путь продукта):**
- `company-tunnel` (тоннели + DNS-провижининг) и `bitrix-handlers` (`/install`, `/session`, `/register`, placement) — ядро поставки. Их безопасность — блокер №1: по AUDIT.md там C1 (маршруты в корне, нет `ApiPath.Bitrix`), C3 (fail-open токен → перехват аккаунта, `isEmailAlreadyVerified`, перезапись пароля), H4 (DNS из внешнего запроса). Чинить **до** любого показа клиентам.
- Первый реальный модуль после спайков — «Задачи 2.0», но **интеграционный контур Б24 (тоннели+битра) нужно проверить раньше** — он определяет, вообще ли продукт продаётся.

### 1.4 Аудит Битрикс24 и blueprint (`docs/bitrix-audit/`, 14 .md, все прочитаны)

- **212** — хаб-оглавление аудита коробки Б24 (108 модулей, 98k PHP, 8.6M строк; crm = 258 таблиц/702 индекса).
- **214 «Итоговый Blueprint»** — целевая архитектура: слои EDGE → APPLICATION → infra (PostgreSQL 16 первая истина, Redis, Kafka, Vault); модули identity/org/crm-core/chat/contact-center + поперечные policy/timeline/search/realtime/notification; 14 кросс-модульных инвариантов (idempotency_key на командах, побочные эффекты через outbox после COMMIT, ноль DDL в рантайме, ноль skip_check — только SYSTEM_ACTOR + аудит, одинаковые timestamps везде, кэш прав TTL ≤ 60 с, SafeFetcher для внешних fetch, HMAC-SHA256+timestamp+nonce на webhook, классы ≤ 1000 строк); шина outbox→relay→Kafka; модель доступа PDP/PEP поверх closure+materialized ACL; план фаз 0–4 (4–8 нед на фазу).
- **Этапы:** 1) иерархия компании и матрица прав (org_node ltree + closure, rbac_role/policy_rule, acl_item PARTITION BY entity_type) → 2) ядро CRM (crm_entity с attrs JSONB, CommandBus как единственная точка записи, стадии с частичным UNIQUE) → 3) коммуникации/real-time (chat, watermark last_read_message_id, счётчики с overflow, WS-gateway с replay) → 4) омниканальность/телефония (line/line_session/session_deadline, DispatchPolicy, HMAC-вебхуки). Логика зависимостей: 1 → 2 → 3 → 4 (без прав и ядра нельзя строить чат, без чата — контакт-центр); **это логика построения, а не календарный график** — см. §1.3 о горизонте.
- **Из аудитов 224/226/228 берём:** append-only журналы с причиной; явный именованный конвейер обновления сущности (validate→save→history→search→events→cache→counters→push); «таблица-очередь + степпер» вместо кронов; checkpoint процесса = одна строка + advisory-lock; прочитанность через COUNT(DISTINCT) вместо денормализации; «один активный таймер» через PK/partial unique; подписи процессов с allowlist unserialize; scope-модель REST с одинаковой ошибкой «нет сущности/нет доступа».
- **Не повторяем (антипаттерны Б24):** ноль FK и триггеров (осиротевший ACL = fail-open); синхронная тяжёлая работа в веб-запросе (старт процессов в цикле); `eval` как механизм (агенты = RACE→RCE); N+1 вместо агрегатов; три параллельные модели одной связи; SQL-конкатенация (`PERMISSION_ID` в LIKE — латентная инъекция); права по умолчанию «разрешено» + `disableCheckAccess()`; гонки из-за отсутствия схемных гарантий (нет UNIQUE на активной записи); serialize+gzip PHP-массив как шаблон процесса; md5-подписи webhook без timestamp; бессрочные PermissionToken; TTL кэшей прав 100 суток.
- **Для нас вывод:** этапы аудита — это содержательная программа модулей (§4 Этапы 4-5), но строится она НА Twenty, а не с нуля: closure/ltree → object-права + roles Twenty; crm_entity/attrs → стандартные объекты + metadata полей Twenty; chat/watermark → сущность тредов ADR-002; CommandBus/outbox → workflow-движок + механизмы Twenty.
- **14 инвариантов blueprint — применять выборочно, не «весь список в `smb-*`» (требование Sonnet, п.3.2):**
  - *Применимы к коду форка:* idempotency_key, побочные эффекты после COMMIT (насколько позволяют механизмы Twenty), created/updated/deleted_at, строковые идентичности, кэш прав ≤60 с (для СВОИХ хуков), SafeFetcher (внешние HTTP из smb-*), HMAC+timestamp+nonce на webhook, materialized счётчики с overflow, append-only логи с trace_id, классы ≤ 1000 строк.
  - *Не применимы / конфликтуют с Twenty:* outbox→Kafka-шина (у Twenty нет транзакционной шины — события идут через свои очереди/воркеры, свои модули используют их), «ноль DDL в рантайме» (Twenty СОЗДАЁТ объекты/поля через metadata API с DDL в рантайме — это штатная работа, которую мы не отменяем), отдельный PDP gRPC (заменяется object-правами + ролями Twenty), closure-таблица org (если выбраны штатные механизмы иерархии).
  - Окончательную таблицу «инвариант → применим/нет → чем заменён» ведёт исполнитель в `docs/reports/` по мере спайков.

---

## 2. Целевая архитектура (по ADR, рекомендации — утвердить владельцу до кода)

### 2.1 Механизм модулей — ADR-001, вариант C (гибрид)

- **Модуль по умолчанию = Twenty App** (манифест: objects, fields, views, pageLayouts, navigationMenuItems, workflows, logicFunctions) → 0 патчей ядра, штатные install/uninstall/upgrade/миграции per workspace.
- **Швы в ядро** — только там, где Apps не хватает (серверные `@WorkspaceQueryHook`, свои типы полей, тяжёлый UI вне Remote DOM). Каждый шов = строка `PATCHES.md`, >1 строки = ADR.
- Включение per workspace: install/uninstall App; feature-flags (`core.feature-flag`) — дополнительный гейт для швов.

### 2.2 Единый шов — ADR-007, вариант B (два импорта в ядре)

- **Сервер:** `packages/smb-server` → `SmbServerModule`; в ядре ровно один импорт (запись **P-002**), кандидаты: `twenty-server/src/modules/modules.module.ts` либо `workspace-query-hook.module.ts` (выбор — прототипом со stub-хуком `task.updateOne`, ADR-007 «Риск: Nest Discovery»).
- **Фронт:** `packages/smb-front` → `SmbFrontEntry` (brand.css + провайдеры); одна точка монтирования (запись **P-003**).
- При добавлении пакета обязательно: `workspaces.packages` в корневом `package.json` (не glob!), `project.json` (Nx), зависимость потребителя в package.json, `COPY ./packages/smb-*` в `packages/twenty-docker/twenty/Dockerfile` (иначе образ без нашего кода).
- CI: allowlist для P-002/P-003 — только одна строка-импорт, прочие правки тех же файлов = новый ID + ADR.

### 2.3 Визуальный слой — ADR-005, вариант C (токены + ≤5 швов) + перенос smb-skin

- Brand-слой без патчей: `packages/smb-brand/brand.css` с переопределением `--t-*` через `html.light`/`html.dark` (специфичность выше генерируемых таблиц); подключение из `SmbFrontEntry`.
- Учесть: `@supports (corner-shape: squircle)`-блок (иначе двойные радиусы), `html body { font-family }` вместо правки `index.css`, генератор токенов `npx nx generateTokens twenty-ui` (файлы тем править нельзя).
- Разрешённые швы (fallback, не первый шаг): `index.css`, `index.html`, `DefaultWorkspaceLogo.ts`, `PageFavicon.tsx`, `auth/Logo.tsx`.
- Перенос smb-skin из старого форка — механизм, пути и порядок работ: **§5**.

### 2.4 Прочие ADR (кратко, рекомендации к утверждению)

- **ADR-002 беседы:** фаза 1 — нативные треды-на-запись (без Mattermost-контейнера); права на сообщения = объектные права роли + серверная проверка в шве; мост Mattermost — опцией позже.
- **ADR-003 процессы:** штатный workflow как исполнитель + человеческий шаг = запись `task` со ссылкой на шаг run. Механизм пробуждения — **по отчёту S4**: «Поправки» ADR-003 предпочитают logic function (`answerToolCall`) — это 0 патчей; PRE-hook `task.updateOne` требует шва. В ADR тело ещё говорит «PRE-hook» — противоречие снимает A2 Ч.3.
- **ADR-004 обязательные поля:** правило `requirementRules` поверх существующего `validationRule`-evaluator; enforcement в репозитории (одна транзакция, GraphQL+REST). **Известный блокер: ключа `validationRules` в app-манифесте нет** — правило нельзя доставить вместе с модулем и оно не удалится при uninstall; способ доставки определяет S3 (post-install функция / CLI / свой шов). Язык выражений и поведение при `error` (fail-open?) — тоже S3; пример выражения в ADR-004 пока сочинён. UI — `FormFieldInput`/`SettingsObjectValidationRulesSection` без правок ядра.
- **ADR-006 пресеты/лицензия — разделён:** **006a** (пресет = набор App-ов, дистрибуция — свой `APP_REGISTRY_URL` + tarball, **не использовать** Enterprise-каталоги upstream: billing/enterprise/sso/event-logs/record-share) — утвердить после S1. **006b** (свой слой активации, «свой Enterprise-ключ», обход лимитов) — **не реализовать до юридического заключения** (AGPL §13, воспроизведение лицензируемой функции). **Лимиты `MAX_WORKSPACES=5` / `MAX_SEATS=25` на инстанс** — блокер роста на 6-м клиенте: реальное поведение при превышении выяснит A2 п.1.2, решение — только после юриста.

---

## 3. Принципы: как добавлять функционал, ничего не ломая и не замедляя

1. **Сначала вопрос «штатно?»** — перед любым новым кодом искать штатный механизм Twenty (Apps-манифест, feature-flag, `validationRule`, page-layout таб, `WidgetType.FRONT_COMPONENT`, query-hook). Референс — `docs/arch/00-baseline-analysis.md` §7.1.
2. **Новый код — только в наши каталоги:** `packages/smb-*`, `apps/`. Правка файла вне их → строка в `PATCHES.md` (CI не пропустит без неё); >1 строки → ADR.
3. **Избегать топ-10 опасных зон** (`00-baseline-analysis.md` §7.2): generated-metadata (churn 404), core-modules/application (356), page-layout (257), workflow (256/206/137). Предпочитаемые швы — зоны с churn ≤ 10: query-hook (9), task (8), роутинг (7), константы.
4. **House rules Twenty** (из CLAUDE.md) обязательны: короткие `//`-комментарии только WHY, types не interfaces, no `any`, именованные экспорты, Lingui для строк, Linaria для стилей, иконки только из `twenty-ui/icon`, существующие guards/helpers из `twenty-shared/utils` и `@sniptt/guards` не переизобретать.
5. **Проверки после каждой задачи** (правило форка — нельзя заявлять «прошло» без прогона):
   - `npx nx build twenty-shared` (если трогали shared) → `npx tsgo -p tsconfig.json --noEmit` в затронутом пакете (не `nx typecheck` — Nx-кэш врёт);
   - `npx nx lint:diff-with-main <pkg> [--configuration=fix]`;
   - тест на поведение: `npx jest path/to/file.spec.ts --config=packages/<pkg>/jest.config.mjs` (twenty-ui — vitest);
   - `NOT RUN` + причина, если запустить нельзя.
6. **Не коммитить** `locales/*.po` и `locales/generated/*` (кроме задач про переводы), AI-атрибут в коммиты (CI режет).
7. **Скорость:** тяжёлые сьюты не гонять целиком на каждом шаге — diff-based lint, точечные jest-файлы, `nx affected` от `upstream-base`. Интеграционные тесты — отдельным этапом.
8. **Обновление с upstream** — только по `docs/arch/UPSTREAM_BASE.md`: конфликты разрешаются исключительно по реестру PATCHES.
9. **Шапка П0 (правило приёмки):** «готово/проходит/подтверждено» принимается только с приложенным выводом ЗАПУЩЕННОЙ команды; нет прогона → `NOT RUN` + причина в одну строку. Каждый факт — `path:line` на базе `twenty/v2.45.6` (worktree `../new-crm-base`) + вывод команды; ссылка на `docs/*.mdx` поведением не доказывается. Отчёты — `docs/reports/<id>.md` (Сделано / Подтверждено прогоном / NOT RUN / Расхождения с ADR / Вопросы владельцу).
10. **Новые сущности/поля** — через штатный путь миграций: `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`; upgrade-команды — только в каталог текущей `TWENTY_CURRENT_VERSION`, timestamp строго больше всех существующих.

---

## 4. Этапы работ

### Этап 0 — Частичное утверждение ADR (владелец, без кода)
- **Утвердить сейчас можно только направление:** ADR-001 (гибрид Apps+швы — хеджированное), ADR-005 (принцип «токены, затем швы»; список швов — «по запросу»), ADR-006a (пресеты как наборы Apps — после S1).
- **НЕ утверждать до спайков:** ADR-002 (S2 + права чата + слабая проверка «нет уведомлений»), ADR-003 (S4; в теле всё ещё «PRE-hook», а «Поправки» предпочитают logic function — переписать тело по A2 Ч.3), ADR-004 (S3, язык выражений, нет ключа `validationRules` в манифесте), ADR-007 (stub-хук NOT RUN, возможный цикл импортов, занижена цена шва).
- **НЕ утверждать до юриста:** ADR-006b (лицензия/свой Enterprise-ключ/лимиты). Юристу: AGPL §13 и платные модули, правка констант в AGPL-части, 475 Enterprise-файлов в образе, товарный знак при ребрендинге, персданные РФ, SBOM + право переносить код старого форка и использовать обои/логотип клиента.
- Смена статуса ADR — таблицей + телом одним коммитом, **после** отчёта соответствующего спайка.

### Этап 0.5 — Спайки и закрытие дыр верификации (обязательно до кода модулей)
Порядок: параллельно **A2** · **D2** · спайки **S1 → S3 → S4 → S2 → S5**.
- **A2** — перепроверки слабых «VERIFIED» (уведомления: есть ли переиспользуемый inbox; лимиты 5/25 — что реально произойдёт на 6-м workspace/26-м юзере; точная сигнатура `@WorkspaceQueryHook` — привести ADR-004/007 к одной форме; язык выражений `validationRule` + поведение при `error` + какие пути записи не покрыты; схема input `answerToolCall`; код применения pageLayoutTabs) + **единый шов:** проверка цикла импортов `smb-server`↔`twenty-server` (throwaway-worktree, nx typecheck/module boundaries), измерение **M1 (пакеты) vs M2 (каталоги внутри ядра)** двумя `git diff --stat`, выбор ОДНОГО подхода для сервера, фронта и скина, выбор точки входа фронта по churn.
- **S1** — живой `twenty app apply`: install → данные → upgrade → uninstall (гипотеза «Hello module = 0 патчей»).
- **S3** — `requirementRules`: язык, доставка правил без ключа в манифесте (известный блокер), fail-open/fail-closed, покрытые/непокрытые пути записи.
- **S4** — `answerToolCall` из logic function (нужен worker; при нехватке памяти — Linux VM, см. §5.5).
- **S2** — виджет в Remote DOM (partial DOM хватает для чата в карточке?).
- **S5** — техническая часть лимитов/лицензии (юридическая — юристу).
- **D2** — доставка/бэкапы: исправить регулярку forced-command (запрет ведущего `-`), два SSH-ключа (staging/prod), deploy.sh (HEALTH_TIMEOUT, запрет автоотката во время upgrade → RESTORE_DB_REQUIRED, всегда дамп при upstream-merge), mem_limit в compose, **проверочный restore** (сейчас NOT RUN = бэкапов фактически нет), offsite rclone check, SBOM/provenance, отдельный поддомен staging (dev. занят старым проектом).
- Промпты 4–8 Sonnet привязаны к спайкам: 4 (визуал) — после A2 п.2.3–2.4; 5 (Задачи 2.0) — после S3; 6 (беседы) — после S2+S3; 7 (процессы) — после S4+промпта 6; 8 (упаковка) — после S1+промпта 5.
- Отчёты спайков — в `docs/reports/<id>.md` по шапке П0.

### Этап 1 — Инфраструктура швов (каркас)
1. `packages/smb-server` + `packages/smb-front` (+ при необходимости `smb-brand`): project.json, package.json, регистрации в workspaces/Nx/tsconfig/Docker.
2. Прототип stub-хук `@WorkspaceQueryHook('task.updateOne')` → выбор файла P-002 (ADR-007), внести P-002/P-003 в `PATCHES.md`.
3. `SmbFrontEntry` с пустым brand.css → точка входа P-003.
4. CI: allowlist-проверка одиночной строки шва в `check-core-patches.sh`.
5. Проверка: dev-стек поднимается (`bash packages/twenty-utils/setup-dev-env.sh`, `yarn start`), stub-хук отвечает в логе, `npx nx build twenty-shared` + typecheck зелёные.

### Этап 2 — Перенос визуала (см. §2.3 и §5)
1. Извлечь источник smb-skin из `/Users/haiiro/SandBox/twenty-dev/new-crm` (`git archive origin/master`) — рабочее дерево `SandBox/new-crm` пустое (см. §5.1).
2. Разместить модуль как **наш каталог** `packages/twenty-front/src/modules/smb-skin/**` — включить каталог в список «Наше» в `docs/PATCHES.md` + `check-core-patches.sh` (одна правка правил, не отдельные записи на каждый файл).
3. Точки входа в ядро — **сократить до минимума после A2 п.2.4** (цель — ≤2 швов фронта через единый `SmbFrontEntry`, а не 3): `twenty-front/src/index.tsx` (импорт css, 1 строка) — кандидат P-013; подмена скелетонов (`loading/components/*`) — НЕ критична, по умолчанию без правок ядра, при необходимости отдельный ID после измерения churn; не забыть про правку, которой требовало подключение `SmbSkinProviderEffect` к `BaseThemeProvider` в старом форке (в v1 плана не была учтена).
4. `packages/twenty-ui` в новом форке НЕ тронут (проверено: `git diff twenty/v2.45.6..HEAD` — только docs/scripts/CI). **Не копировать** из старого форка `design-tokens/background.ts` (wallpaper-base64) и `theme-constants/theme-dark.css` — дефолтные обои давать слоем скина; точку подключения выбрать по A2 п.2.4 (churn загрузчиков измерен: `loading/` = 13 коммитов/6мес — не ноль).
5. Вернуть ассет логотипа (`outledge-logo.png` — в git отсутствует, будет 404) и собрать `brand.css` из токенов.
6. Проверка: light/dark, squircle-радиусы, шрифт, обои/акцент/прозрачность панели, контраст текста; `tsgo --noEmit` + `lint:diff-with-main twenty-front`; smb-skin юнит-тесты (есть) прогнать.

### Этап 3 — Первые модули (по порядку промптов Sonnet)
- **Сначала Hello module (S1)** — минимальный объект+страница+меню через `twenty app apply`, проверка жизненного цикла install → данные → upgrade → uninstall. Это «рецепт добавления модуля» (§3), фиксируется в `docs/dev/`.
- **Первый реальный модуль — «Задачи 2.0»** (промпт 5, после S3), а не документооборот: он проверяет ключевую функцию — обязательные поля по статусам. Документооборот (doc-management как референс из старого форка) — следующим модулем, после отработки механизма.
- ⚠️ **Порядок двух реальных модулей зависит от ответа на §1.3 («разворот» или «канал»).** При модели «канал» интеграционный контур Б24 (спайк S6) и документооборот выдвигаются вперёд — без них нечего показывать в Б24; при модели «разворот» текущий порядок сохраняется. **До ответа владельца порядок не меняется.**

### Этап 4 — Ядро CRM и процессы (blueprint-этапы 250/256/258 → механизмы Twenty)

| Blueprint (Б24-ориентир) | Механизм Twenty | Патчей ядра |
|---|---|---|
| Иерархия org («руководитель видит подчинённых»), матрица прав | object-права Twenty иерархии НЕ дают; row-level rights — Enterprise-файлы (нельзя). Свой фильтр подчинённых — в `smb-server`-хуках поверх closure-дерева (app-объект) | **ошибка v1 «0–1»: реальная цена M (фильтр в хуках) до L, зависит от A2 и юр. решения по RLS — не занижать** |
| Обязательные поля по статусам | ADR-004: `requirementRules` поверх `validationRule` | 0 для правил, **НО** доставка правил — блокер: ключа в манифесте нет (гейт S3) |
| Задачи с полями, комментарии | standard object `task` + field metadata + notes/timeline (App-манифест) | 0 |
| Процессы/согласования | ADR-003: workflow + человеческий шаг = `task`. Механизм пробуждения — **по отчёту S4**: logic function = 0 патчей, PRE-hook = шов | 0 (logic function) / 1 (шов) — зависит от S4 |
| Запрет обхода прав (`disableCheckAccess`) | правило кода форка: обхода нет; инвариант blueprint №4 (SYSTEM_ACTOR + аудит) | 0 |
| Инварианты blueprint | **не «весь список»** — выборочная таблица «применимы / не применимы и почему» в §1.4 (outbox→Kafka, «ноль DDL в рантайме», PDP gRPC — не применимы к форку Twenty) | 0 |

Порядок работ внутри этапа: права/иерархия → обязательные поля → задачи с полями → человеческие шаги процессов (каждый пункт закрывается App-манифестом, где возможно).

### Этап 5 — Коммуникации и real-time (222/260), затем омниканальность (216)

- **Фаза 1 (ADR-002):** сущность треда-на-запись (`conversationThread` + сообщения, ленивое создание), виджет в карточке через pageLayoutTab / `WidgetType.FRONT_COMPONENT` — без правок ядра.
- **Unread/уведомления:** модуля уведомлений у Twenty нет (общий риск ADR-002/003) — закрывается `smb-server` (счётчики по паттерну watermark/overflow из blueprint) + cron-эскалация SLA.
- **Realtime:** сначала штатные подписки/SSE Twenty; дельта-синхронизация и replay — только если штатного не хватит (модуль в `smb-server`).
- **Омниканальность (этап 216) — последней и вне горизонта ближайшего года:** в ближайший год не планируется (согласовано с Sonnet); это НЕ означает, что этапы 1→4 идут подряд в один продукт — §1.4 (аудит Б24) задаёт логику построения, а не сроки. контакт-центр = новый модуль `smb-*` (line / line_session / session_deadline, DispatchPolicy, HMAC-SHA256+timestamp+nonce вебхуки, SafeFetcher). С этим этапом форк разъезжается с upstream сильнее всего — поэтому он идёт после всех.

---

## 5. Перенос визуала (smb-skin) из старого форка

### 5.1 Источник: где лежит код (проверено)

- ⚠️ **`SandBox/new-crm` — рабочее дерево ПУСТОЕ:** `packages/twenty-front/src` = 0 файлов, git-индекс пуст, ветка `smb/workspace-isolation-gaps` без коммитов, stash битый. Копий на диске нет (`~/backup` с тгз/bundle отсутствует).
- ✅ **Источник истины: `/Users/haiiro/SandBox/twenty-dev/new-crm`**, `origin/master = 9ffddb1b59` (pack 1.7G) — там 95 путей `packages/twenty-front/src/modules/smb-skin/**` + все точки подключения. Читать: `git show origin/master:<path>`, извлекать: `git archive`.
- Оттуда же берём и **doc-management / messenger / company-tunnel** как референсы модулей (§4 Этап 3+) — во всём `SandBox` это единственный сохранившийся источник кода старого форка.
- Ассет `packages/twenty-front/public/images/smb/outledge-logo.png` в git не коммитился нигде — восстановить/создать заново (иначе `SmbBrandLockup` даёт 404).

### 5.2 Механизм скина (как это устроено — переносим как есть)

Слой изолирован и самодостаточен: CSS-переменные + jotai-атомы + один provider-effect, собственный код не трогает темы Twenty, кроме 2 файлов (см. швы):

- **Вход:** `SmbSkinProviderEffect` (layout-effect, подключается к `BaseThemeProvider`) ставит на `<html>` атрибуты `data-skin='smb'`, `data-theme`, `data-wallpaper` и инлайн-переменные `--color-accent`, `--panel-opacity`, `--app-bg-image/dim/blur` (`utils/applySmbThemeVars`).
- **Статичная палитра** — `styles/smb-skin.css` (слои L0 canvas / L1 surface / L2 card), плюс `smb-records.css`, `smb-messenger.css`. Стек — CSS-переменные, не Linaria-токены.
- **Состояние:** jotai-атомы `states/smb*State` (акцент, обои, opacity панели, режим сайдбара, chrome-портали `smbChromeTitleHostState`/`smbChromeActionsHostState`); настройки юзера — `settings/SmbAppearanceSettings` (вкладка Theme в настройках).
- **Контраст/читаемость:** `pickSmbOnBgColors`, `pickSmbProgressiveGlassText`, luminance/contrast по семплированной картинке обоев.
- **Брендинг:** `components/SmbBrandLockup` + `constants/SmbCompanyLogoUrl`.
- **UI-компоненты:** топ-бар (контент/часы/пользователь/статус рабочего дня), скелетоны загрузки, `SmbWallpaperLayers`, табы-пилюли, records-подмодуль (карточки сделок/задач, `SmbTaskCheck`), messenger-подмодуль (layout/чат-лист).
- **Тесты:** юнит-тесты уже есть (provider effect, records hooks/utils, messenger utils, SmbTaskCheck).

### 5.3 Группировка путей при переносе

| Группа | Пути | Действие |
|---|---|---|
| **Переносится как есть** | весь `packages/twenty-front/src/modules/smb-skin/**` (95 путей) | в «наш каталог» (см. 5.4, шов-1) |
| **Швы ядра (записи в PATCHES)** | **один**: `twenty-front/src/index.tsx:23` (импорт css, 1 строка) → кандидат **P-013**. Скелетоны (`loading/components/*`) — **без правок ядра по умолчанию** (не критичны; если всё же нужны — отдельный ID после измерения churn в A2 п.2.4) | allowlist как у P-002/P-003: ровно одна строка-импорт |
| **Не копировать** | `twenty-ui/design-tokens/background.ts` (wallpaper-base64), `twenty-ui/src/theme-constants/theme-dark.css` | в двадцать-core этих правок НЕТ (чистая база) — откатывать нечего; просто не переносим из старого форка, дефолтные обои даёт слой скина |
| **Не переносить** | `locales/*.po`, `locales/generated/*` (правило репо); `smb/` (deploy-обвязка — в twenty-core уже своя) | пропустить; русские строки скина перевести через Lingui заново |

### 5.4 Два варианта размещения — выбор отложен в A2 п.2.2

Решение ОДНО для всего форка (сервер, фронт, скин) принимается по измерению M1 (пакеты `packages/smb-*`, как ADR-007) vs M2 (каталоги внутри ядра `twenty-*/src/smb/`) двумя `git diff --stat` + проверкой цикла импортов. До того выбора оба варианта в плане — черновые:
- **Вариант A/M2 (каталог-исключение):** скин и модули внутри ядра со allowlist-правилом в `check-core-patches.sh`. Плюсы: нет правок workspaces/yarn.lock/Dockerfile, нет цикла импортов. Минусы: нарушает правило «код только в `packages/smb-*`», требует правки самого правила.
- **Вариант B/M1 (отдельные пакеты — ADR-007 буквально):** чище по правилам, но реальная цена шва больше двух строк (workspaces, yarn.lock — самый частый конфликт при merge, Dockerfile, плюс риск цикла импортов Nx) — проверяется в A2.

Аргумент в пользу M2 для скина: он импортирует внутренности twenty-front (`@/…`, BaseThemeProvider, loading) — вынос в `packages/smb-front` потребует переворачивания зависимостей (twenty-front ← smb-front) и правки десятков импортов. Аргумент в пользу M1: правило «код только в `packages/smb-*`» не приходится менять. Итог — только по числам A2 п.2.2.
- `brand.css` по ADR-005 (токены `--t-*`) остаётся дополнением к скину — сам ADR-005 не отменяется: скин даёт «обои/акцент/стекло», brand.css — базовые токены компонент.

### 5.5 Оценка трудоёмкости

- Восстановление источника: **0.5 дня** (архив из twenty-dev, проверка сборки на v2.45.6).
- Перенос и подключение скина: **1–2 дня** (модуль изолирован; риск — дрейф API Twenty между v2.42.6 и v2.45.6: проверить `BaseThemeProvider`, loading-компоненты, AppTopBar-портали, jotai-места).
- Регрессия: юнит-тесты скина гоняются штатно; топ-бар/settings-вкладка покрытия нет → ручной визуальный чек-лист (wallpaper on/off, light/dark, opacity, контраст).
- ⚠️ Память машины **проверено 2026-10-09: 16 ГБ** (`sysctl hw.memsize` = 17179869184), swap 3072M занято 2208M, диск 80 ГБ свободно. Данные «8 ГБ» в v1 плана неверны (старый отчёт `docs/_audit/verification-report.md` про 7.8 GiB — вероятно, другой хост/момент). Режим по умолчанию — `bash smb/dev/up.sh --lite` (шапка П0); не запускать одновременно полный стек + nx build + Playwright. **S4 (worker) и тяжёлые прогоны — только после `vm_stat`/`vm.swapusage`; при нехватке → Linux VM (решение владельца — до Этапа 1).**
- Перенос локализаций скина (ключи `smb` в `*.po`, 4492 msgid в en.po старого форка): строки перевести через Lingui заново — **+0.5–1 день** сверх оценок выше (в v1 не был учтён).

---

## 6. Роли ECC/скиллов при работе

| Фаза | Кто |
|---|---|
| Планирование, декомпозиция | planner, multi-plan / plan-PRD |
| Архитектура швов, ADR | code-architect, architect |
| Реализация | feature-dev + prp-implement |
| Ревью каждого изменения | code-reviewer, python/typescript-reviewer |
| Безопасность (швы, auth) | security-reviewer, security-scan |
| Тесты/e2e | tdd-guide, e2e-runner, browser-qa |
| Контроль качества | quality-gate, harness-audit, santa-loop (независимая верификация) |

Правило (П0, §3.9): любое «готово» из таблицы принимается только с приложенным выводом запущенной команды — ревью-агент циклом прогон команды не заменяет.

Ограничение: агенты ECC работают в терминале/сессии Claude; в текущем окружении (Hermes) их навыки уже установлены глобально (138 skills) — применять `plan`, `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `e2e-testing` по мере прохождения этапов.

---

## 7. Definition of Done для каждой задачи

1. Код в наших каталогах либо строка в `PATCHES.md` (+ADR при >1 строки правки).
2. `tsgo --noEmit` и `lint:diff-with-main` зелёные (запущены фактически, не «должны пройти»).
3. Есть тест на новое поведение и он прогнан; если нет — `NOT RUN` + причина в отчёте.
4. Нет нарушений house rules (any, JSDoc, переизобретённые guards, Lingui/Linaria, иконки из twenty-ui).
5. Docker/workspaces/Nx обновлены, если добавлялся пакет.
6. Швы внутри действующего allowlist (P-002/P-003 и сокращённый набор из Этапа 2 — после A2 п.2.4) — diff ровно одна разрешённая строка.
7. Деплой/бэкап-изменения принимаются только по чек-листу D2: bats+shellcheck зелёные, проверочный restore с реальным RTO, откат во время upgrade не прерывает миграцию (RESTORE_DB_REQUIRED).

## 8. Риски

- **Discovery хуков из стороннего пакета** — прототип до выбора места P-002 (ADR-007).
- **Churn зон `application`/`page-layout`/`workflow`** — держаться Apps-манифеста и хуков.
- **Enterprise-gate** — не трогать каталоги `@license Enterprise`, свой слой активации.
- **Зона Apps самая активная (356 коммитов)** — механизм может меняться, проверять при каждом merge upstream.
- **Сломанный старый форк** — не копировать файлы из new-crm вслепую: каждую переносимую единицу проверять typecheck'ом на v2.45.6.
