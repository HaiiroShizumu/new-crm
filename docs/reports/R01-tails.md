# R01 — Хвостовые проверки (задачи 1–5 от Sonnet) + консолидация

**Дата:** 2026-10-09 · **Исполнитель:** Hermes · **База:** `twenty/v2.45.6`
**Общий контекст:** `docs/CONTEXT-LOG.md` · **Приложения:** `docs/PLAN-fork-work.md` (v2), `docs/CONTEXT-LOG.md` (полностью)

**Общие правила (П0):** «готово» только с выводом запущенной команды; иначе `NOT RUN` + причина.

---

## А. Подтверждено (команда → вывод → вывод по факту; нумерация подразделов = нумерация задач)

### 1.1 Рабочее дерево до работы

```
$ git -C /Users/haiiro/SandBox/twenty-core status --short
 M docs/PATCHES.md
 M scripts/check-core-patches.sh
?? .github/workflows/fork-release.yaml
?? docs/CONTEXT-LOG.md
?? docs/PLAN-fork-work.md
?? docs/REPORT-01-otvet-hermes.md
?? docs/adr/
?? docs/arch/02-citations.csv
?? docs/arch/02-verification-at-base.md
?? docs/dev/
?? docs/ops/
?? scripts/verify-citations.sh
?? smb/
```

**Факт:** всё это было незакоммичено — работа предыдущей сессии не была сохранена.

### 1.2 Секреты в `smb docs .github scripts`

```
$ rg -c "PASSWORD=|SECRET|TOKEN=|BEGIN .*PRIVATE KEY|ghp_|github_pat_" smb docs .github scripts | wc -l
16
```

Отфильтровано отдельным прогоном по нашим файлам (вне upstream CI):

```
.github/workflows/fork-ci.yaml:147:  PGPASSWORD=postgres psql -h localhost ...   ← локальный CI postgres
docs/ops/deploy.md:99:  printf "PG_DATABASE_PASSWORD=%s\n" "$PG_PASS"            ← shell-шаблон, значение из .secrets
docs/ops/deploy.md:105: без ENCRYPTION_KEY (или исторического APP_SECRET) ...     ← проза
smb/deploy/docker-compose.yml:36,70:  APP_SECRET: ${APP_SECRET:-}                ← подстановка из окружения
smb/deploy/smoke/README.md:13,15:  STAGING_BASIC_AUTH_PASSWORD=... \             ← плейсхолдеры
```

Плюс проверка на литералы base64/hex ≥40 символов — только SHA-пины GitHub Actions (`uses: actions/checkout@34e114876b0b...`).
Плюс `.env.example` — явные `REPLACE_WITH_openssl_rand_*`.

**Вывод: реальных секретов нет — только плейсхолдеры, `${{ secrets.* }}` и shell-шаблоны.** В коммит ничего секретного не попало.

### 1.3 Ветка и коммит

```
$ git checkout -b chore/docs-and-tooling && git add docs scripts smb .github/workflows/fork-release.yaml && git commit
pre-commit: check-core-patches --staged…  OK: правок ядра нет (staged в не-наших каталогах пуст).
pre-commit: oxlint (2 file(s), timeout 15s)… Found 0 warnings and 0 errors.

$ git show --stat HEAD
f8136a6aa2 docs: fork ADR/arch/plan, deploy+dev tooling, patch-registry tooling
 41 files changed, 3986 insertions(+), 11 deletions(-)
```

**Факт:** ветка создана, закоммичено 41 файл (docs/, scripts/, smb/, fork-release.yaml), **не запушена** (по заданию пуш делает владелец). `locales` и `.env` не включены (`.gitignore` покрывает `**/**/.env`).

### 2.1 Контрольные суммы

```
$ cd backups && shasum -a 256 -c SHA256SUMS
smb-skin-origin-9ffddb1b59.tar.gz: OK
new-crm-full-9ffddb1b59.bundle: OK
```

| Файл | sha256 |
|---|---|
| `smb-skin-origin-9ffddb1b59.tar.gz` | `1109f09de94f2046dbb89cca480f67eb195c26aa1b2abfed95608b37c75ef872` |
| `new-crm-full-9ffddb1b59.bundle` | `38036c2d1dc82decf6d1fe191cdf39a82295ffb80cc9d57029c27c75d32234fc` |

*(использован `shasum -a 256 -c` — эквивалент `sha256sum -c`; в macOS нет `sha256sum`.)*

### 2.2 Распаковка и сверка с источником

```
$ git -C ~/SandBox/twenty-dev/new-crm ls-tree -r --name-only origin/master -- packages/twenty-front/src/modules/smb-skin | wc -l
95
$ find <tmp>/packages/twenty-front/src/modules/smb-skin -type f | wc -l
95
$ diff /tmp/src.txt /tmp/dst.txt     # (сортированные списки путей)
(diff пуст)
```

**95 = 95, расхождений нет, недостающих файлов нет.**

### 2.3 Состав «142 файла» в tar

| Тип | Кол-во |
|---|---|
| Записей в tar (`tar -tzf \| wc -l`) | **142** |
| из них директорий | 36 |
| из них **реальных файлов** | **106** |

Разбивка 106 файлов:

| Каталог | Файлов | Пояснение |
|---|---|---|
| `packages/twenty-front/src/modules/smb-skin/` | 95 | сам модуль: utils 21, records 19, components 14, states 10, constants 10, messenger 7, types 6, settings 4, styles 3, hooks 1 |
| `packages/twenty-front/src/index.tsx` | 1 | точка входа (`import '@/smb-skin/styles/smb-skin.css'`) |
| `packages/twenty-front/src/loading/components/` | 7 | 5 загрузчиков + 2 storybook-истории (точки подключения скелетонов) |
| `packages/twenty-ui/` | 2 | `design-tokens/background.ts`, `src/theme-constants/theme-dark.css` |
| `docs/CODEBASE_MAP_MODULE_SMB_SKIN.md` | 1 | карта модуля |

**Вывод: 142 — это записи tar включая 36 директорий; файлов 106 (95 модуль + 11 точек подключения + 2 twenty-ui).**

### 2.4 Целостность bundle

```
$ git -C ~/SandBox/twenty-dev/new-crm bundle verify backups/new-crm-full-9ffddb1b59.bundle
... is okay
The bundle contains this ref:
9ffddb1b59dce55e61912ae0e428fad4acc80eaa refs/remotes/origin/master
The bundle records a complete history.

$ git clone --mirror backups/new-crm-full-9ffddb1b59.bundle /tmp/verify-clone
$ git -C /tmp/verify-clone log -1 --format=%H refs/remotes/origin/master
9ffddb1b59dce55e61912ae0e428fad4acc80eaa
```

**9ffddb1b59… подтверждён.** `/tmp/verify-clone` удалён (`ls: No such file or directory`).
*Замечание:* `HEAD` в клоне указывает на `refs/heads/main`, которой в bundle нет (bundle собирался по `origin/master`) — артефакт упаковки, не порча данных; все объекты на месте.

### 2.5 Секреты в истории `origin/master`

```
$ git grep -nI -E "(BITRIX|TOKEN|SECRET|PASSWORD)\w*[=:]\s*['\"]?[A-Za-z0-9_\-]{16,}" origin/master -- . ':!*.po' | head -50
```

Первые 50 совпадений — **все** плейсхолдеры/документация upstream: `replace_me_with_a_random_string`, `my_strong_password`, `test-webhook-secret`, `twenty-app-dev-secret-not-for-production`, `EMAIL_SMTP_PASSWORD='gmail_app_password'` (доки на 10 языках).

Сужение до **собственных модулей форка** (`company-tunnel`, `mattermost`, `doc-management`, `smb-skin`):

```
$ git grep -nI -E "(BITRIX|REGRU|MATTERMOST|TUNNEL|DNS_)..." origin/master -- <эти каталоги> | grep -v <плейсхолдеры>
(пусто)
```

| Проверка | Результат |
|---|---|
| Секреты в модулях форка | **0 совпадений** |
| `BEGIN .*PRIVATE KEY` | 2 файла — **upstream-фикстуры тестов** (`test/integration/.../jwt-key-rotation.fixture.ts`, `.../encrypt-signing-key-private-keys.integration-spec.ts`), не форк |
| `ghp_…` / `github_pat_…` | **нет** |

**Вывод: утечек в истории не найдено.**

### 2.6 Логотип `outledge-logo.png`

```
$ mdfind -name "outledge-logo"     → (пусто)
$ find ~ -name "outledge*"         → (пусто)
```

**Нигде на диске нет — воссоздавать** (файл вообще не коммитился; подтверждает вывод записей 02/03 CONTEXT-LOG).

### 4. Churn (задача 4)

Команда в заголовке: `git log --since=6.months --oneline <ref> -- <path> | wc -l`

| Путь | upstream/main | upstream-base |
|---|---|---|
| `packages/twenty-front/src/loading` | 15 | 13 |
| `packages/twenty-front/src/index.tsx` | 8 | 7 |
| `packages/twenty-front/src/modules/ui/theme/components/BaseThemeProvider.tsx` | 8 | 7 |
| `packages/twenty-server/src/modules/modules.module.ts` | 4 | 2 |
| `packages/twenty-server/.../workspace-query-hook/workspace-query-hook.module.ts` | 4 | 2 |

**Вывод:** серверные кандидаты в шов (ADR-007) — **самые дешёвые (4/2)**; фронтовые (loading 15, index 8, BaseThemeProvider 8) — в 2–4 раза дороже. Это числовое подтверждение того, что фронтовый шов надо минимизировать, а серверный — предпочтителен.

### 5. Память (задача 5) — состояние Б/В

Команда: `vm_stat` + `sysctl vm.swapusage` каждые 5 с, 12 замеров (60 с), macOS `vm_stat` интервала не принимает — цикл в shell.

**Состояние: `--lite` (server + front, без worker), Cursor запущен, 10:48:45–10:49:45**

| # | Pages free | Pages active | Pages wired | swap total / used |
|---|---|---|---|---|
| 1 | 11491 | 197504 | 218393 | 6144M / 4836M |
| 3 | 7703 | 206558 | 206286 | 6144M / 4836M |
| 5 | 8669 | 179065 | 237583 | 6144M / 4836M |
| 7 | 8123 | 178073 | 241094 | 6144M / 4836M |
| 9 | 8934 | 179417 | 227490 | **6144M / 4828M** |
| 11 | 11049 | 169780 | 231186 | 6144M / 4828M |
| 12 | 8866 | 156002 | 251399 | 6144M / 4828M |

*(строки 2,4,6,8,10 опущены — в таблицу не влезли; полный вывод 12/12 есть в сессии Hermes)*

**Расчёт:** свободно 7.7k–11.5k pages × 16384 B = **126–188 МБ**; swap **4828M/6144M = 78.6%**; Docker VM 8 ГБ (db 70MiB/1GiB, redis 22MiB/8GiB).

**Сравнение с замером до старта стека (10:30):** swap 3072M/2208M → 6144M/4828M (Docker сам увеличил swap-файл вдвое, занял +2.6 ГБ).

### Дополнительно (не из списка, но выполнено в рамках консолидации)

| Действие | Результат |
|---|---|
| Перенос `agent-harnesses` → `twenty-core` | `note-document-212` → `docs/bitrix-audit/` (14 .md), `.cursor`, `.claude` (48 ECC-скиллов, конфликтов с upstream **0**), `.cursor/scripts/*` → `scripts/` (пересечение имён **пустое**), ECC (242M) → `ECC/` + `.git/info/exclude`, `.ecc`, `docs/tooling/*` |
| Gap #2419 (симклинг `scripts`) | **закрыт без симклинга**: `node -e "require('./scripts/lib/shell-split.js')"` → `OK` |
| `agent-harnesses` | **удалена** (`rmdir` прошёл) |
| Расширение `OURS` в `check-core-patches.sh` | `.claude/|.cursor/` — правка нашим каталогом, строка PATCHES не нужна |
| Коммиты | `f8136a6aa2` (41 файл), `5da7a7d01a` (1208 файлов адаптеров), `53604ea5a9` (доки + фикс quotepath) |
| Сервер | `up.sh --lite` → фронт **http://localhost:3001/** (200, `<title>Twenty</title>`), API **http://localhost:3000** (`/graphql` 200, `/healthz` ok) |

---

## Б. NOT RUN

| # | Что | Причина |
|---|---|---|
| 1 | Состояние памяти «простой (без IDE)» | требует остановки стека и закрытия Cursor; владелец просил сервер оставить запущенным → **не выполнял, чтобы не отменять просьбу** |
| 2 | Состояние «--lite без Cursor» | Cursor запущен владельцем; закрывать IDE без запроса не стал |
| 3 | Спайки A2 / S1–S5 / D2 | не начинались (`docs/reports/` до сегодняшнего дня не существовало) |
| 4 | Полный `typecheck`/`lint`/юнит-сьют | не запускался (память под стеком: swap 78.6% — риск OOM по П0) |
| 5 | `outledge-logo.png` восстановление | файла нигде нет — только создание заново (задача не ставилась) |

---

## В. Расхождения с планом/ADR

| # | Обнаружено | Действие |
|---|---|---|
| 1 | **Баг `check-core-patches.sh`**: git оборачивает пути с кириллицей в кавычки → `^docs/` не матчился → проверка падала **на собственных доках форка**; CI упал бы и на GitHub после добавления `docs/bitrix-audit/` | Исправлено: `git -c core.quotepath=false` в обоих режимах (`--staged` и diff) → коммит `53604ea5a9`. Проверено: `check-core-patches --staged` → OK, diff-режим (как в CI) → «все правки ядра записаны» |
| 2 | В §5.5 плана v1 было «8 ГБ RAM» — неверно | Уже исправлено в v2 (проверено: 16 ГБ); swap под стеком 78.6% — усугубляет вывод про VM для S4 |
| 3 | Коммит `53604ea5a9` содержит и доки, и фикс скрипта (сообщение говорит только о фиксе) | История не переписывалась (риск > польза); фактический состав: `git show --stat` → 21 файл |
| 4 | `git bundle verify` вне репозитория даёт `error: need a repository` | Не расхождение, а особенность git; запускается из репо — вывод приведён в §2.4 |
| 5 | `HEAD` в mirror-клоне bundle указывает на несуществующую `main` | Артефакт упаковки (bundle собран по `refs/remotes/origin/master`); объекты целостны — `9ffddb1b59…` подтверждён |

---

## Г. Вопросы владельцу

1. **Пуш трёх коммитов** (`f8136a6aa2`, `5da7a7d01a`, `53604ea5a9`) в `origin` — по заданию пушите вы. До пуша: ветка `chore/docs-and-tooling` локальная.
2. **VM для S4/тяжёлых прогонов** — swap под лёгким `--lite` уже 78.6%, свободно ~130–190 МБ. Рекомендую VM до Этапа 1 (решение не принимал — оно ваше).
3. **Замеры памяти «простой» и «без Cursor»** — нужны ли (требуют остановки стека/закрытия Cursor), или состояния Б/В достаточно?
4. **`docs/tooling/ECC-testrun.log` (652 КБ)** перенесён в репо — оставить как журнал или удалить из git?
5. **`outledge-logo.png`** — воссоздаём (и где взять оригинал: есть у вас или рисуем заново)?

---

# Приложение A — `docs/PLAN-fork-work.md` (v2), целиком


```markdown
1|# ПЛАН: форк Twenty (smb-CRM) — сборка продукта без ломки ядра
2|
3|**Статус:** v2 — пересобран по замечаниям Sonnet от 2026-10-09 (см. `docs/REPORT-01-otvet-hermes.md`; общий контекст — `docs/CONTEXT-LOG.md`). К исполнителю НЕ передавать до прохождения Этапа 0.5 (спайки A2/S1–S5).
4|**Исполнитель:** Sonnet (Claude Code) в `/Users/haiiro/SandBox/twenty-core`
5|**Дата:** 2026-10-09
6|
7|---
8|
9|## 0. Источники и что из них берём
10|
11|| Источник | Что берём | Что НЕ берём |
12||---|---|---|
13|| `SandBox/twenty-core` | Рабочий форк: база `twenty/v2.45.6`, реестр `docs/PATCHES.md`, CI-гейт `check-core-patches`, 7 ADR (`docs/adr/`), baseline-анализ `docs/arch/00-baseline-analysis.md`, правила агентов `CLAUDE.md` (раздел «Форк») | — (это основа) |
14|| `SandBox/new-crm` | **Только визуал smb-skin** (компоненты Smb* + темы twenty-ui) и накопленный опыт аудита (`AUDIT.md` — список ошибок, которых мы НЕ повторяем) | Код модулей company-tunnel/doc-management/messenger на v2.42.6 — не переносим (см. §2.2) |
15|| **`docs/bitrix-audit/`** (перенесён из `agent-harnesses/note-document-212`) | Аудит Битрикс24: что копируем (задачи, комментарии, права, BPM), что отвергаем (D7-монолит, слабая типизация данных), целевой blueprint и этапность | — |
16|| ECC (перенесён: `ECC/`, `.claude/`, `.cursor/`, `scripts/lib|hooks`) | Многоагентные роли: planner → code-architect → code-reviewer → security-reviewer → e2e-runner; хуки quality-gate; santa-loop для контроля. Скиллы Hermes глобальны (`~/.hermes/skills`) — папка не нужна | — |
17|
18|---
19|
20|## 1. Текущее состояние проекта
21|
22|### 1.1 twenty-core (основной репозиторий, рабочая база)
23|
24|- **База форка:** тег `twenty/v2.45.6` (коммит `6007ad5a7f`), remote `upstream` = twentyhq/twenty (полное зеркало, push отключён), `origin` = github HaiiroShizumu/new-crm.
25|- **Уже сделано и работает:**
26|  - `docs/PATCHES.md` — реестр правок ядра (сейчас 1 строка: P-001, раздел «Форк» в CLAUDE.md). Правило: наш код только в `packages/smb-*`, `apps/`, `docs/`, `scripts/`, `smb/`; всё остальное = строка в реестре, >1 строки = + ADR.
27|  - CI `fork-ci.yaml` + `scripts/check-core-patches.sh` — падает на любой правке ядра без строки в реестре; ветка `upstream-base` = база для `nx affected`.
28|  - 7 ADR в `docs/adr/`, все в статусе «Предложено».
29|  - `docs/arch/00-baseline-analysis.md` — аудит кодовой базы: штатные точки расширения, churn-карта (коммитов upstream/6мес), топ-10 опасных зон.
30|  - `docs/dev/local-env.md`, `docs/ops/{deploy,backup-restore,migration-policy}.md`.
31|  - Правила агентов в `CLAUDE.md`/`AGENTS.md` (симлинк): house rules Twenty, команды, gotchas (twenty-shared/dist, Nx-кэш, locales/*.po, upgrade-команды).
32|- **Ещё НЕ сделано (нет кода):** `packages/smb-*` не существуют, `apps/` нет, визуала нет, dev-стек не поднят, все ADR не утверждены, швы P-002/P-003 не внесены в реестр.
33|
34|### 1.2 new-crm (старый форк, v2.42.6) — почему НЕ переносим код
35|
36|По `AUDIT.md` (2026-10-02): ветка `smb/crm-custom`, 452 файла отклонений, +17k строк, и:
37|
38|- **C1–C4 критично:** битый typecheck (сломан фронт и сервер), `ApiPath.Bitrix` отсутствует → маршруты в корне, 12 незадекларированных ключей конфига, fail-open токен Bitrix → `/session` выдаёт логин по одному email (перехват аккаунта), `isEmailAlreadyVerified: true`.
39|- **H1–H4:** открытый редирект, токены открытым текстом, правка внутренностей апстрима, DNS/Tunnel-provisioning снаружи.
40|- Ветка не запушена, HEAD не собирается.
41|
42|**Вывод:** модули старого форка переносим только после ревизии, как референс логики; визуал — переносим сразу (§5); деплой-обвязка `smb/` старого форка — не переносится (в twenty-core уже своя `smb/dev`, `smb/deploy`).
43|
44|### 1.3 Модель продукта — приложение в маркетплейсе Битрикс24 (задача владельца, 2026-10-09)
45|
46|Продукт = **приложение в маркетплейсе Б24, ставится только документооборот**. Механика:
47|
48|1. Пользователь ставит приложение из маркетплейса → **разворачивается полная CRM** на его сабдомене, с тоннелями (мультиарендность — `company-tunnel` из аудита старого форка).
49|2. **Внутри Б24 показывается документооборот, относящийся к их порталу Twenty.** Свой домен у клиента в Б24 быть не может — один домен у всех (политика Б24), поэтому роутинг идёт по параметрам портала, а не по хосту.
50|3. **Регистрация в Twenty — автоматическая, через Битру** (обход по другим параметрам), без ручного логина.
51|
52|**Следствия (это критический путь продукта):**
53|- `company-tunnel` (тоннели + DNS-провижининг) и `bitrix-handlers` (`/install`, `/session`, `/register`, placement) — ядро поставки. Их безопасность — блокер №1: по AUDIT.md там C1 (маршруты в корне, нет `ApiPath.Bitrix`), C3 (fail-open токен → перехват аккаунта, `isEmailAlreadyVerified`, перезапись пароля), H4 (DNS из внешнего запроса). Чинить **до** любого показа клиентам.
54|- Первый реальный модуль после спайков — «Задачи 2.0», но **интеграционный контур Б24 (тоннели+битра) нужно проверить раньше** — он определяет, вообще ли продукт продаётся.
55|
56|### 1.4 Аудит Битрикс24 и blueprint (`docs/bitrix-audit/`, 14 .md, все прочитаны)
57|
58|- **212** — хаб-оглавление аудита коробки Б24 (108 модулей, 98k PHP, 8.6M строк; crm = 258 таблиц/702 индекса).
59|- **214 «Итоговый Blueprint»** — целевая архитектура: слои EDGE → APPLICATION → infra (PostgreSQL 16 первая истина, Redis, Kafka, Vault); модули identity/org/crm-core/chat/contact-center + поперечные policy/timeline/search/realtime/notification; 14 кросс-модульных инвариантов (idempotency_key на командах, побочные эффекты через outbox после COMMIT, ноль DDL в рантайме, ноль skip_check — только SYSTEM_ACTOR + аудит, одинаковые timestamps везде, кэш прав TTL ≤ 60 с, SafeFetcher для внешних fetch, HMAC-SHA256+timestamp+nonce на webhook, классы ≤ 1000 строк); шина outbox→relay→Kafka; модель доступа PDP/PEP поверх closure+materialized ACL; план фаз 0–4 (4–8 нед на фазу).
60|- **Этапы:** 1) иерархия компании и матрица прав (org_node ltree + closure, rbac_role/policy_rule, acl_item PARTITION BY entity_type) → 2) ядро CRM (crm_entity с attrs JSONB, CommandBus как единственная точка записи, стадии с частичным UNIQUE) → 3) коммуникации/real-time (chat, watermark last_read_message_id, счётчики с overflow, WS-gateway с replay) → 4) омниканальность/телефония (line/line_session/session_deadline, DispatchPolicy, HMAC-вебхуки). Порядок строго 1→2→3→4.
61|- **Из аудитов 224/226/228 берём:** append-only журналы с причиной; явный именованный конвейер обновления сущности (validate→save→history→search→events→cache→counters→push); «таблица-очередь + степпер» вместо кронов; checkpoint процесса = одна строка + advisory-lock; прочитанность через COUNT(DISTINCT) вместо денормализации; «один активный таймер» через PK/partial unique; подписи процессов с allowlist unserialize; scope-модель REST с одинаковой ошибкой «нет сущности/нет доступа».
62|- **Не повторяем (антипаттерны Б24):** ноль FK и триггеров (осиротевший ACL = fail-open); синхронная тяжёлая работа в веб-запросе (старт процессов в цикле); `eval` как механизм (агенты = RACE→RCE); N+1 вместо агрегатов; три параллельные модели одной связи; SQL-конкатенация (`PERMISSION_ID` в LIKE — латентная инъекция); права по умолчанию «разрешено» + `disableCheckAccess()`; гонки из-за отсутствия схемных гарантий (нет UNIQUE на активной записи); serialize+gzip PHP-массив как шаблон процесса; md5-подписи webhook без timestamp; бессрочные PermissionToken; TTL кэшей прав 100 суток.
63|- **Для нас вывод:** этапы аудита — это содержательная программа модулей (§4 Этапы 4-5), но строится она НА Twenty, а не с нуля: closure/ltree → object-права + roles Twenty; crm_entity/attrs → стандартные объекты + metadata полей Twenty; chat/watermark → сущность тредов ADR-002; CommandBus/outbox → workflow-движок + механизмы Twenty.
64|- **14 инвариантов blueprint — применять выборочно, не «весь список в `smb-*`» (требование Sonnet, п.3.2):**
65|  - *Применимы к коду форка:* idempotency_key, побочные эффекты после COMMIT (насколько позволяют механизмы Twenty), created/updated/deleted_at, строковые идентичности, кэш прав ≤60 с (для СВОИХ хуков), SafeFetcher (внешние HTTP из smb-*), HMAC+timestamp+nonce на webhook, materialized счётчики с overflow, append-only логи с trace_id, классы ≤ 1000 строк.
66|  - *Не применимы / конфликтуют с Twenty:* outbox→Kafka-шина (у Twenty нет транзакционной шины — события идут через свои очереди/воркеры, свои модули используют их), «ноль DDL в рантайме» (Twenty СОЗДАЁТ объекты/поля через metadata API с DDL в рантайме — это штатная работа, которую мы не отменяем), отдельный PDP gRPC (заменяется object-правами + ролями Twenty), closure-таблица org (если выбраны штатные механизмы иерархии).
67|  - Окончательную таблицу «инвариант → применим/нет → чем заменён» ведёт исполнитель в `docs/reports/` по мере спайков.
68|
69|---
70|
71|## 2. Целевая архитектура (по ADR, рекомендации — утвердить владельцу до кода)
72|
73|### 2.1 Механизм модулей — ADR-001, вариант C (гибрид)
74|
75|- **Модуль по умолчанию = Twenty App** (манифест: objects, fields, views, pageLayouts, navigationMenuItems, workflows, logicFunctions) → 0 патчей ядра, штатные install/uninstall/upgrade/миграции per workspace.
76|- **Швы в ядро** — только там, где Apps не хватает (серверные `@WorkspaceQueryHook`, свои типы полей, тяжёлый UI вне Remote DOM). Каждый шов = строка `PATCHES.md`, >1 строки = ADR.
77|- Включение per workspace: install/uninstall App; feature-flags (`core.feature-flag`) — дополнительный гейт для швов.
78|
79|### 2.2 Единый шов — ADR-007, вариант B (два импорта в ядре)
80|
81|- **Сервер:** `packages/smb-server` → `SmbServerModule`; в ядре ровно один импорт (запись **P-002**), кандидаты: `twenty-server/src/modules/modules.module.ts` либо `workspace-query-hook.module.ts` (выбор — прототипом со stub-хуком `task.updateOne`, ADR-007 «Риск: Nest Discovery»).
82|- **Фронт:** `packages/smb-front` → `SmbFrontEntry` (brand.css + провайдеры); одна точка монтирования (запись **P-003**).
83|- При добавлении пакета обязательно: `workspaces.packages` в корневом `package.json` (не glob!), `project.json` (Nx), зависимость потребителя в package.json, `COPY ./packages/smb-*` в `packages/twenty-docker/twenty/Dockerfile` (иначе образ без нашего кода).
84|- CI: allowlist для P-002/P-003 — только одна строка-импорт, прочие правки тех же файлов = новый ID + ADR.
85|
86|### 2.3 Визуальный слой — ADR-005, вариант C (токены + ≤5 швов) + перенос smb-skin
87|
88|- Brand-слой без патчей: `packages/smb-brand/brand.css` с переопределением `--t-*` через `html.light`/`html.dark` (специфичность выше генерируемых таблиц); подключение из `SmbFrontEntry`.
89|- Учесть: `@supports (corner-shape: squircle)`-блок (иначе двойные радиусы), `html body { font-family }` вместо правки `index.css`, генератор токенов `npx nx generateTokens twenty-ui` (файлы тем править нельзя).
90|- Разрешённые швы (fallback, не первый шаг): `index.css`, `index.html`, `DefaultWorkspaceLogo.ts`, `PageFavicon.tsx`, `auth/Logo.tsx`.
91|- Перенос smb-skin из старого форка — механизм, пути и порядок работ: **§5**.
92|
93|### 2.4 Прочие ADR (кратко, рекомендации к утверждению)
94|
95|- **ADR-002 беседы:** фаза 1 — нативные треды-на-запись (без Mattermost-контейнера); права на сообщения = объектные права роли + серверная проверка в шве; мост Mattermost — опцией позже.
96|- **ADR-003 процессы:** штатный workflow как исполнитель + человеческий шаг = запись `task` со ссылкой на шаг run. Механизм пробуждения — **по отчёту S4**: «Поправки» ADR-003 предпочитают logic function (`answerToolCall`) — это 0 патчей; PRE-hook `task.updateOne` требует шва. В ADR тело ещё говорит «PRE-hook» — противоречие снимает A2 Ч.3.
97|- **ADR-004 обязательные поля:** правило `requirementRules` поверх существующего `validationRule`-evaluator; enforcement в репозитории (одна транзакция, GraphQL+REST). **Известный блокер: ключа `validationRules` в app-манифесте нет** — правило нельзя доставить вместе с модулем и оно не удалится при uninstall; способ доставки определяет S3 (post-install функция / CLI / свой шов). Язык выражений и поведение при `error` (fail-open?) — тоже S3; пример выражения в ADR-004 пока сочинён. UI — `FormFieldInput`/`SettingsObjectValidationRulesSection` без правок ядра.
98|- **ADR-006 пресеты/лицензия — разделён:** **006a** (пресет = набор App-ов, дистрибуция — свой `APP_REGISTRY_URL` + tarball, **не использовать** Enterprise-каталоги upstream: billing/enterprise/sso/event-logs/record-share) — утвердить после S1. **006b** (свой слой активации, «свой Enterprise-ключ», обход лимитов) — **не реализовать до юридического заключения** (AGPL §13, воспроизведение лицензируемой функции). **Лимиты `MAX_WORKSPACES=5` / `MAX_SEATS=25` на инстанс** — блокер роста на 6-м клиенте: реальное поведение при превышении выяснит A2 п.1.2, решение — только после юриста.
99|
100|---
101|
102|## 3. Принципы: как добавлять функционал, ничего не ломая и не замедляя
103|
104|1. **Сначала вопрос «штатно?»** — перед любым новым кодом искать штатный механизм Twenty (Apps-манифест, feature-flag, `validationRule`, page-layout таб, `WidgetType.FRONT_COMPONENT`, query-hook). Референс — `docs/arch/00-baseline-analysis.md` §7.1.
105|2. **Новый код — только в наши каталоги:** `packages/smb-*`, `apps/`. Правка файла вне их → строка в `PATCHES.md` (CI не пропустит без неё); >1 строки → ADR.
106|3. **Избегать топ-10 опасных зон** (`00-baseline-analysis.md` §7.2): generated-metadata (churn 404), core-modules/application (356), page-layout (257), workflow (256/206/137). Предпочитаемые швы — зоны с churn ≤ 10: query-hook (9), task (8), роутинг (7), константы.
107|4. **House rules Twenty** (из CLAUDE.md) обязательны: короткие `//`-комментарии только WHY, types не interfaces, no `any`, именованные экспорты, Lingui для строк, Linaria для стилей, иконки только из `twenty-ui/icon`, существующие guards/helpers из `twenty-shared/utils` и `@sniptt/guards` не переизобретать.
108|5. **Проверки после каждой задачи** (правило форка — нельзя заявлять «прошло» без прогона):
109|   - `npx nx build twenty-shared` (если трогали shared) → `npx tsgo -p tsconfig.json --noEmit` в затронутом пакете (не `nx typecheck` — Nx-кэш врёт);
110|   - `npx nx lint:diff-with-main <pkg> [--configuration=fix]`;
111|   - тест на поведение: `npx jest path/to/file.spec.ts --config=packages/<pkg>/jest.config.mjs` (twenty-ui — vitest);
112|   - `NOT RUN` + причина, если запустить нельзя.
113|6. **Не коммитить** `locales/*.po` и `locales/generated/*` (кроме задач про переводы), AI-атрибут в коммиты (CI режет).
114|7. **Скорость:** тяжёлые сьюты не гонять целиком на каждом шаге — diff-based lint, точечные jest-файлы, `nx affected` от `upstream-base`. Интеграционные тесты — отдельным этапом.
115|8. **Обновление с upstream** — только по `docs/arch/UPSTREAM_BASE.md`: конфликты разрешаются исключительно по реестру PATCHES.
116|9. **Шапка П0 (правило приёмки):** «готово/проходит/подтверждено» принимается только с приложенным выводом ЗАПУЩЕННОЙ команды; нет прогона → `NOT RUN` + причина в одну строку. Каждый факт — `path:line` на базе `twenty/v2.45.6` (worktree `../new-crm-base`) + вывод команды; ссылка на `docs/*.mdx` поведением не доказывается. Отчёты — `docs/reports/<id>.md` (Сделано / Подтверждено прогоном / NOT RUN / Расхождения с ADR / Вопросы владельцу).
117|10. **Новые сущности/поля** — через штатный путь миграций: `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`; upgrade-команды — только в каталог текущей `TWENTY_CURRENT_VERSION`, timestamp строго больше всех существующих.
118|
119|---
120|
121|## 4. Этапы работ
122|
123|### Этап 0 — Частичное утверждение ADR (владелец, без кода)
124|- **Утвердить сейчас можно только направление:** ADR-001 (гибрид Apps+швы — хеджированное), ADR-005 (принцип «токены, затем швы»; список швов — «по запросу»), ADR-006a (пресеты как наборы Apps — после S1).
125|- **НЕ утверждать до спайков:** ADR-002 (S2 + права чата + слабая проверка «нет уведомлений»), ADR-003 (S4; в теле всё ещё «PRE-hook», а «Поправки» предпочитают logic function — переписать тело по A2 Ч.3), ADR-004 (S3, язык выражений, нет ключа `validationRules` в манифесте), ADR-007 (stub-хук NOT RUN, возможный цикл импортов, занижена цена шва).
126|- **НЕ утверждать до юриста:** ADR-006b (лицензия/свой Enterprise-ключ/лимиты). Юристу: AGPL §13 и платные модули, правка констант в AGPL-части, 475 Enterprise-файлов в образе, товарный знак при ребрендинге, персданные РФ, SBOM + право переносить код старого форка и использовать обои/логотип клиента.
127|- Смена статуса ADR — таблицей + телом одним коммитом, **после** отчёта соответствующего спайка.
128|
129|### Этап 0.5 — Спайки и закрытие дыр верификации (обязательно до кода модулей)
130|Порядок: параллельно **A2** · **D2** · спайки **S1 → S3 → S4 → S2 → S5**.
131|- **A2** — перепроверки слабых «VERIFIED» (уведомления: есть ли переиспользуемый inbox; лимиты 5/25 — что реально произойдёт на 6-м workspace/26-м юзере; точная сигнатура `@WorkspaceQueryHook` — привести ADR-004/007 к одной форме; язык выражений `validationRule` + поведение при `error` + какие пути записи не покрыты; схема input `answerToolCall`; код применения pageLayoutTabs) + **единый шов:** проверка цикла импортов `smb-server`↔`twenty-server` (throwaway-worktree, nx typecheck/module boundaries), измерение **M1 (пакеты) vs M2 (каталоги внутри ядра)** двумя `git diff --stat`, выбор ОДНОГО подхода для сервера, фронта и скина, выбор точки входа фронта по churn.
132|- **S1** — живой `twenty app apply`: install → данные → upgrade → uninstall (гипотеза «Hello module = 0 патчей»).
133|- **S3** — `requirementRules`: язык, доставка правил без ключа в манифесте (известный блокер), fail-open/fail-closed, покрытые/непокрытые пути записи.
134|- **S4** — `answerToolCall` из logic function (нужен worker; при нехватке памяти — Linux VM, см. §5.5).
135|- **S2** — виджет в Remote DOM (partial DOM хватает для чата в карточке?).
136|- **S5** — техническая часть лимитов/лицензии (юридическая — юристу).
137|- **D2** — доставка/бэкапы: исправить регулярку forced-command (запрет ведущего `-`), два SSH-ключа (staging/prod), deploy.sh (HEALTH_TIMEOUT, запрет автоотката во время upgrade → RESTORE_DB_REQUIRED, всегда дамп при upstream-merge), mem_limit в compose, **проверочный restore** (сейчас NOT RUN = бэкапов фактически нет), offsite rclone check, SBOM/provenance, отдельный поддомен staging (dev. занят старым проектом).
138|- Промпты 4–8 Sonnet привязаны к спайкам: 4 (визуал) — после A2 п.2.3–2.4; 5 (Задачи 2.0) — после S3; 6 (беседы) — после S2+S3; 7 (процессы) — после S4+промпта 6; 8 (упаковка) — после S1+промпта 5.
139|- Отчёты спайков — в `docs/reports/<id>.md` по шапке П0.
140|
141|### Этап 1 — Инфраструктура швов (каркас)
142|1. `packages/smb-server` + `packages/smb-front` (+ при необходимости `smb-brand`): project.json, package.json, регистрации в workspaces/Nx/tsconfig/Docker.
143|2. Прототип stub-хук `@WorkspaceQueryHook('task.updateOne')` → выбор файла P-002 (ADR-007), внести P-002/P-003 в `PATCHES.md`.
144|3. `SmbFrontEntry` с пустым brand.css → точка входа P-003.
145|4. CI: allowlist-проверка одиночной строки шва в `check-core-patches.sh`.
146|5. Проверка: dev-стек поднимается (`bash packages/twenty-utils/setup-dev-env.sh`, `yarn start`), stub-хук отвечает в логе, `npx nx build twenty-shared` + typecheck зелёные.
147|
148|### Этап 2 — Перенос визуала (см. §2.3 и §5)
149|1. Извлечь источник smb-skin из `/Users/haiiro/SandBox/twenty-dev/new-crm` (`git archive origin/master`) — рабочее дерево `SandBox/new-crm` пустое (см. §5.1).
150|2. Разместить модуль как **наш каталог** `packages/twenty-front/src/modules/smb-skin/**` — включить каталог в список «Наше» в `docs/PATCHES.md` + `check-core-patches.sh` (одна правка правил, не отдельные записи на каждый файл).
151|3. Точки входа в ядро — **сократить до минимума после A2 п.2.4** (цель — ≤2 швов фронта через единый `SmbFrontEntry`, а не 3): `twenty-front/src/index.tsx` (импорт css, 1 строка) — кандидат P-004; подмена скелетонов (`loading/components/*`) — НЕ критична, по умолчанию без правок ядра, при необходимости отдельный ID после измерения churn; не забыть про правку, которой требовало подключение `SmbSkinProviderEffect` к `BaseThemeProvider` в старом форке (в v1 плана не была учтена).
152|4. `packages/twenty-ui` в новом форке НЕ тронут (проверено: `git diff twenty/v2.45.6..HEAD` — только docs/scripts/CI). **Не копировать** из старого форка `design-tokens/background.ts` (wallpaper-base64) и `theme-constants/theme-dark.css` — дефолтные обои давать слоем скина; точку подключения выбрать по A2 п.2.4 (churn загрузчиков измерен: `loading/` = 13 коммитов/6мес — не ноль).
153|5. Вернуть ассет логотипа (`outledge-logo.png` — в git отсутствует, будет 404) и собрать `brand.css` из токенов.
154|6. Проверка: light/dark, squircle-радиусы, шрифт, обои/акцент/прозрачность панели, контраст текста; `tsgo --noEmit` + `lint:diff-with-main twenty-front`; smb-skin юнит-тесты (есть) прогнать.
155|
156|### Этап 3 — Первые модули (по порядку промптов Sonnet)
157|- **Сначала Hello module (S1)** — минимальный объект+страница+меню через `twenty app apply`, проверка жизненного цикла install → данные → upgrade → uninstall. Это «рецепт добавления модуля» (§3), фиксируется в `docs/dev/`.
158|- **Первый реальный модуль — «Задачи 2.0»** (промпт 5, после S3), а не документооборот: он проверяет ключевую функцию — обязательные поля по статусам. Документооборот (doc-management как референс из старого форка) — следующим модулем, после отработки механизма.
159|
160|### Этап 4 — Ядро CRM и процессы (blueprint-этапы 250/256/258 → механизмы Twenty)
161|
162|| Blueprint (Б24-ориентир) | Механизм Twenty | Патчей ядра |
163||---|---|---|
164|| Иерархия org («руководитель видит подчинённых»), матрица прав | object-права Twenty иерархии НЕ дают; row-level rights — Enterprise-файлы (нельзя). Свой фильтр подчинённых — в `smb-server`-хуках поверх closure-дерева (app-объект) | **ошибка v1 «0–1»: реальная цена M (фильтр в хуках) до L, зависит от A2 и юр. решения по RLS — не занижать** |
165|| Обязательные поля по статусам | ADR-004: `requirementRules` поверх `validationRule` | 0 для правил, **НО** доставка правил — блокер: ключа в манифесте нет (гейт S3) |
166|| Задачи с полями, комментарии | standard object `task` + field metadata + notes/timeline (App-манифест) | 0 |
167|| Процессы/согласования | ADR-003: workflow + человеческий шаг = `task`, пробуждение через PRE-hook `task.updateOne` | 0–1 |
168|| Запрет обхода прав (`disableCheckAccess`) | правило кода форка: обхода нет; инвариант blueprint №4 (SYSTEM_ACTOR + аудит) | 0 |
169|| Инварианты blueprint (idempotency, outbox, timestamps, FK) | применять к коду `packages/smb-*`; side-effects — после COMMIT штатными механизмами workflow | 0 |
170|
171|Порядок работ внутри этапа: права/иерархия → обязательные поля → задачи с полями → человеческие шаги процессов (каждый пункт закрывается App-манифестом, где возможно).
172|
173|### Этап 5 — Коммуникации и real-time (222/260), затем омниканальность (216)
174|
175|- **Фаза 1 (ADR-002):** сущность треда-на-запись (`conversationThread` + сообщения, ленивое создание), виджет в карточке через pageLayoutTab / `WidgetType.FRONT_COMPONENT` — без правок ядра.
176|- **Unread/уведомления:** модуля уведомлений у Twenty нет (общий риск ADR-002/003) — закрывается `smb-server` (счётчики по паттерну watermark/overflow из blueprint) + cron-эскалация SLA.
177|- **Realtime:** сначала штатные подписки/SSE Twenty; дельта-синхронизация и replay — только если штатного не хватит (модуль в `smb-server`).
178|- **Омниканальность (этап 216) — последней и вне горизонта ближайшего года:** в ближайший год не планируется (согласовано с Sonnet); это НЕ означает, что этапы 1→4 идут подряд в один продукт — §1.3 аудита задаёт логику, а не сроки. контакт-центр = новый модуль `smb-*` (line / line_session / session_deadline, DispatchPolicy, HMAC-SHA256+timestamp+nonce вебхуки, SafeFetcher). С этим этапом форк разъезжается с upstream сильнее всего — поэтому он идёт после всех.
179|
180|---
181|
182|## 5. Перенос визуала (smb-skin) из старого форка
183|
184|### 5.1 Источник: где лежит код (проверено)
185|
186|- ⚠️ **`SandBox/new-crm` — рабочее дерево ПУСТОЕ:** `packages/twenty-front/src` = 0 файлов, git-индекс пуст, ветка `smb/workspace-isolation-gaps` без коммитов, stash битый. Копий на диске нет (`~/backup` с тгз/bundle отсутствует).
187|- ✅ **Источник истины: `/Users/haiiro/SandBox/twenty-dev/new-crm`**, `origin/master = 9ffddb1b59` (pack 1.7G) — там 95 путей `packages/twenty-front/src/modules/smb-skin/**` + все точки подключения. Читать: `git show origin/master:<path>`, извлекать: `git archive`.
188|- Оттуда же берём и **doc-management / messenger / company-tunnel** как референсы модулей (§4 Этап 3+) — во всём `SandBox` это единственный сохранившийся источник кода старого форка.
189|- Ассет `packages/twenty-front/public/images/smb/outledge-logo.png` в git не коммитился нигде — восстановить/создать заново (иначе `SmbBrandLockup` даёт 404).
190|
191|### 5.2 Механизм скина (как это устроено — переносим как есть)
192|
193|Слой изолирован и самодостаточен: CSS-переменные + jotai-атомы + один provider-effect, собственный код не трогает темы Twenty, кроме 2 файлов (см. швы):
194|
195|- **Вход:** `SmbSkinProviderEffect` (layout-effect, подключается к `BaseThemeProvider`) ставит на `<html>` атрибуты `data-skin='smb'`, `data-theme`, `data-wallpaper` и инлайн-переменные `--color-accent`, `--panel-opacity`, `--app-bg-image/dim/blur` (`utils/applySmbThemeVars`).
196|- **Статичная палитра** — `styles/smb-skin.css` (слои L0 canvas / L1 surface / L2 card), плюс `smb-records.css`, `smb-messenger.css`. Стек — CSS-переменные, не Linaria-токены.
197|- **Состояние:** jotai-атомы `states/smb*State` (акцент, обои, opacity панели, режим сайдбара, chrome-портали `smbChromeTitleHostState`/`smbChromeActionsHostState`); настройки юзера — `settings/SmbAppearanceSettings` (вкладка Theme в настройках).
198|- **Контраст/читаемость:** `pickSmbOnBgColors`, `pickSmbProgressiveGlassText`, luminance/contrast по семплированной картинке обоев.
199|- **Брендинг:** `components/SmbBrandLockup` + `constants/SmbCompanyLogoUrl`.
200|- **UI-компоненты:** топ-бар (контент/часы/пользователь/статус рабочего дня), скелетоны загрузки, `SmbWallpaperLayers`, табы-пилюли, records-подмодуль (карточки сделок/задач, `SmbTaskCheck`), messenger-подмодуль (layout/чат-лист).
201|- **Тесты:** юнит-тесты уже есть (provider effect, records hooks/utils, messenger utils, SmbTaskCheck).
202|
203|### 5.3 Группировка путей при переносе
204|
205|| Группа | Пути | Действие |
206||---|---|---|
207|| **Переносится как есть** | весь `packages/twenty-front/src/modules/smb-skin/**` (95 путей) | в «наш каталог» (см. 5.4, шов-1) |
208|| **Швы ядра (записи в PATCHES)** | `twenty-front/src/index.tsx:23` (импорт css, 1 строка); `loading/components/PageContentSkeletonLoader.tsx`; `loading/components/UserOrMetadataLoader.tsx` (подмена скелетонов) | P-004, P-005, P-006 — только эти строки, allowlist как у P-002/P-003 |
209|| **Откатить (не переносить)** | `twenty-ui/design-tokens/background.ts` (wallpaper-base64), `twenty-ui/src/theme-constants/theme-dark.css` | revert к upstream; дефолтные обои — через слой скина. Если откат ломает поведение → строка в PATCHES + ADR-005 ревизия |
210|| **Не переносить** | `locales/*.po`, `locales/generated/*` (правило репо); `smb/` (deploy-обвязка — в twenty-core уже своя) | пропустить; русские строки скина перевести через Lingui заново |
211|
212|### 5.4 Два варианта размещения — выбор отложен в A2 п.2.2
213|
214|Решение ОДНО для всего форка (сервер, фронт, скин) принимается по измерению M1 (пакеты `packages/smb-*`, как ADR-007) vs M2 (каталоги внутри ядра `twenty-*/src/smb/`) двумя `git diff --stat` + проверкой цикла импортов. До того выбора оба варианта в плане — черновые:
215|- **Вариант A/M2 (каталог-исключение):** скин и модули внутри ядра со allowlist-правилом в `check-core-patches.sh`. Плюсы: нет правок workspaces/yarn.lock/Dockerfile, нет цикла импортов. Минусы: нарушает правило «код только в `packages/smb-*`», требует правки самого правила.
216|- **Вариант B/M1 (отдельные пакеты — ADR-007 буквально):** чище по правилам, но реальная цена шва больше двух строк (workspaces, yarn.lock — самый частый конфликт при merge, Dockerfile, плюс риск цикла импортов Nx) — проверяется в A2.
217|
218|Аргумент в пользу M2 для скина: он импортирует внутренности twenty-front (`@/…`, BaseThemeProvider, loading) — вынос в `packages/smb-front` потребует переворачивания зависимостей (twenty-front ← smb-front) и правки десятков импортов. Аргумент в пользу M1: правило «код только в `packages/smb-*`» не приходится менять. Итог — только по числам A2 п.2.2.
219|- `brand.css` по ADR-005 (токены `--t-*`) остаётся дополнением к скину — сам ADR-005 не отменяется: скин даёт «обои/акцент/стекло», brand.css — базовые токены компонент.
220|
221|### 5.5 Оценка трудоёмкости
222|
223|- Восстановление источника: **0.5 дня** (архив из twenty-dev, проверка сборки на v2.45.6).
224|- Перенос и подключение скина: **1–2 дня** (модуль изолирован; риск — дрейф API Twenty между v2.42.6 и v2.45.6: проверить `BaseThemeProvider`, loading-компоненты, AppTopBar-портали, jotai-места).
225|- Регрессия: юнит-тесты скина гоняются штатно; топ-бар/settings-вкладка покрытия нет → ручной визуальный чек-лист (wallpaper on/off, light/dark, opacity, контраст).
226|- ⚠️ Память машины **проверено 2026-10-09: 16 ГБ** (`sysctl hw.memsize` = 17179869184), swap 3072M занято 2208M, диск 80 ГБ свободно. Данные «8 ГБ» в v1 плана неверны (старый отчёт `docs/_audit/verification-report.md` про 7.8 GiB — вероятно, другой хост/момент). Режим по умолчанию — `bash smb/dev/up.sh --lite` (шапка П0); не запускать одновременно полный стек + nx build + Playwright. **S4 (worker) и тяжёлые прогоны — только после `vm_stat`/`vm.swapusage`; при нехватке → Linux VM (решение владельца — до Этапа 1).**
227|- Перенос локализаций скина (ключи `smb` в `*.po`, 4492 msgid в en.po старого форка): строки перевести через Lingui заново — **+0.5–1 день** сверх оценок выше (в v1 не был учтён).
228|
229|---
230|
231|## 6. Роли ECC/скиллов при работе
232|
233|| Фаза | Кто |
234||---|---|
235|| Планирование, декомпозиция | planner, multi-plan / plan-PRD |
236|| Архитектура швов, ADR | code-architect, architect |
237|| Реализация | feature-dev + prp-implement |
238|| Ревью каждого изменения | code-reviewer, python/typescript-reviewer |
239|| Безопасность (швы, auth) | security-reviewer, security-scan |
240|| Тесты/e2e | tdd-guide, e2e-runner, browser-qa |
241|| Контроль качества | quality-gate, harness-audit, santa-loop (независимая верификация) |
242|
243|Правило (П0, §3.9): любое «готово» из таблицы принимается только с приложенным выводом запущенной команды — ревью-агент циклом прогон команды не заменяет.
244|
245|Ограничение: агенты ECC работают в терминале/сессии Claude; в текущем окружении (Hermes) их навыки уже установлены глобально (138 skills) — применять `plan`, `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `e2e-testing` по мере прохождения этапов.
246|
247|---
248|
249|## 7. Definition of Done для каждой задачи
250|
251|1. Код в наших каталогах либо строка в `PATCHES.md` (+ADR при >1 строки правки).
252|2. `tsgo --noEmit` и `lint:diff-with-main` зелёные (запущены фактически, не «должны пройти»).
253|3. Есть тест на новое поведение и он прогнан; если нет — `NOT RUN` + причина в отчёте.
254|4. Нет нарушений house rules (any, JSDoc, переизобретённые guards, Lingui/Linaria, иконки из twenty-ui).
255|5. Docker/workspaces/Nx обновлены, если добавлялся пакет.
256|6. Швы внутри действующего allowlist (P-002/P-003 и сокращённый набор из Этапа 2 — после A2 п.2.4) — diff ровно одна разрешённая строка.
257|7. Деплой/бэкап-изменения принимаются только по чек-листу D2: bats+shellcheck зелёные, проверочный restore с реальным RTO, откат во время upgrade не прерывает миграцию (RESTORE_DB_REQUIRED).
258|
259|## 8. Риски
260|
261|- **Discovery хуков из стороннего пакета** — прототип до выбора места P-002 (ADR-007).
262|- **Churn зон `application`/`page-layout`/`workflow`** — держаться Apps-манифеста и хуков.
263|- **Enterprise-gate** — не трогать каталоги `@license Enterprise`, свой слой активации.
264|- **Зона Apps самая активная (356 коммитов)** — механизм может меняться, проверять при каждом merge upstream.
265|- **Сломанный старый форк** — не копировать файлы из new-crm вслепую: каждую переносимую единицу проверять typecheck'ом на v2.45.6.
```


---

# Приложение B — `docs/CONTEXT-LOG.md`, целиком


```markdown
1|# CONTEXT-LOG — общий контекст проекта (Hermes ↔ Sonnet ↔ владелец)
2|
3|**Назначение:** один файл-нить контекста. Сюда вносятся: (1) ответы Claude Sonnet, которые владелец присылает в чат Hermes, (2) действия Hermes, (3) состояние проекта. Каждая запись — новая секция сверху вниз (хронология вниз). Файлы отчётов Hermes создаются отдельно (`REPORT-NN-*.md`) и сюда только ссылаются.
4|
5|**Правила ведения:**
6|- Запись = дата/время → источник (путь к пасту/файлу) → суть → что изменено/сделано → что открыто.
7|- Состояние проекта в §0 обновляется при каждой записи.
8|- Факты — только с проверкой (команда + вывод); без прогона — `NOT RUN`.
9|
10|---
11|
12|## Запись 03 — 2026-10-09, ~11:00 (Hermes)
13|
14|**Триггер:** вопрос владельца «используешь ли agent-harnesses? перенеси всё в twenty-core, запусти сервер».
15|
16|### 3.1 Модель продукта — приложение в маркетплейсе Битрикс24 (внесено в план §1.4)
17|
18|- **Что продаём:** приложение в маркетплейсе Б24, устанавливается **только документооборот**.
19|- **При установке приложения** разворачивается **полная CRM** на сабдомене клиента, с тоннелями (мультиарендность) — это `company-tunnel` из аудита старого форка.
20|- **Внутри Б24** (один домен у всех пользователей — политика Б24, свой домен поставить нельзя) показывается **тот документооборот, который относится к их порталу Twenty**.
21|- **Регистрация в Twenty** — автоматическая, **через Битру** (обход по другим параметрам, не ручной логин).
22|- Следствия для архитектуры: `company-tunnel` (тоннели + DNS) и `bitrix-handlers` (install/session/register/placement) — критический путь, их безопасность = блокер (AUDIT.md C1–C3: fail-open токен, перехват аккаунтов — чинить до любого показа клиентам).
23|
24|### 3.2 Консолидация: `agent-harnesses` → `twenty-core` (выполнено)
25|
26|Причина: скиллы Hermes **глобальные** (68 в `~/.hermes/skills`, не зависят от папки) — для них перенос не нужен. Переносить нужно было адаптеры IDE и контент.
27|
28|| Что | Куда | Как |
29||---|---|---|
30|| Аудит Б24 (14 .md) | `docs/bitrix-audit/` | `mv` |
31|| ECC source (242M, git) | `ECC/` | `mv` + `.git/info/exclude` (не в git) |
32|| `.cursor` адаптер (hooks/skills/rules) | `twenty-core/.cursor` | `mv` |
33|| `.claude` адаптер (48 ECC скиллов) | `twenty-core/.claude` | копия в существующий каталог (конфликтов с upstream **0**, `settings.json` upstream не тронут) |
34|| `.cursor/scripts/*` (lib/, hooks/) | `scripts/` | слияние (пересечение имён **пустое**) — **gap #2419 закрыт без симклинга**, `require('./scripts/lib/shell-split.js')` резолвится |
35|| `.ecc` state, ОТЧЁТ/README/setup, лог | `.ecc/`, `docs/tooling/` | `mv` |
36|| `scripts → .cursor/scripts` симклинг | удалён (сломан после переноса `.cursor`) | не нужен: `scripts/` теперь реальный каталог |
37|
38|**Итог:** `agent-harnesses` **удалена**; `git status` чист; `check-core-patches` — OK (OURS расширен на `.claude/|.cursor/` — правка `scripts/`, наш каталог, запись в PATCHES не нужна); два коммита: `f8136a6aa2` (доки/тулинг), `5da7a7d01a` (1208 файлов адаптеров).
39|
40|### 3.3 Сервер запущен
41|
42|- Причина первого отказа: `up.sh` требует Node ^24.5, в PATH был v22 → запуск с `source ~/.nvm/nvm.sh && nvm use 24.16.0`.
43|- Стек: `docker compose -p twenty-dev` (db :5433, redis :6380 — healthy) + `nx run-many -t start -p twenty-server twenty-front` (`--lite`, **без worker**).
44|- **Ссылки (проверены curl):** фронт **http://localhost:3001/** → 200, `<title>Twenty</title>`; API **http://localhost:3000** → `/graphql` 200, `/healthz` ok.
45|- ⚠️ Память под нагрузкой: swap вырос **3072M → 5120M (занято 4156M)**. Ветка: `chore/docs-and-tooling`.
46|
47|### 3.4 Открыто
48|
49|- Спайки A2/S1–S5/D2 — не начинались (см. запись 02).
50|- Пуш двух коммитов — делает владелец.
51|- VM для S4/тяжёлых прогонов — решение владельца (swap под стеком уже 81%).
52|
53|---
54|
55|## Запись 02 — 2026-10-09, ~10:40 (Hermes)
56|
57|**Источник:** критика Sonnet `~/.hermes/composer-pastes/pasted_content_2026-10-09_07-17-19-303_02fdb8.txt` («Оценка плана Hermes») + источник A2/D2/П0/промптов `pasted_content_2026-10-09_06-25-30-964_306f77.txt`.
58|
59|**Сделано Hermes:**
60|1. **Архивы единственной копии старого форка** (п.4.1 критики): `backups/smb-skin-origin-9ffddb1b59.tar.gz` (142 файла, sha256 `1109f09d…f872`) + `backups/new-crm-full-9ffddb1b59.bundle` (1.79 ГБ, `git bundle verify` → complete history).
61|2. **Проверки фактов:** RAM = **16 ГБ** (не 8), swap 2208M/3072M; `git diff twenty/v2.45.6..HEAD` в twenty-core — правок twenty-ui/фронта **нет** (откатывать нечего); churn: `src/loading` = 13, `index.tsx` = 7 коммитов/6мес; `docs/reports/` отсутствует → **спайки A2/S1–S5/D2 не прогонялись**; «Поправки 2026-10-09» в ADR-002/003/004/006 не вшиты в тела (A2 Ч.3 не сделана); опечатка «при >1 строкы» найдена.
62|3. **План пересобран → `docs/PLAN-fork-work.md` v2:** добавлен Этап 0.5 (A2 · D2 · S1→S3→S4→S2→S5), Этап 0 переписан на частичное утверждение ADR, PRE-hook→«по отчёту S4», блокер `validationRules`/гейт S3, орг-иерархия «0–1»→M–L, 006b заморожен до юриста, лимиты 5/25 внесены, швы фронта сокращаются до ≤2 после A2 п.2.4, M1/M2 выбор отложен, первый модуль = Hello→«Задачи 2.0», локализации +0.5–1 день, омниканальность вне горизонта года, П0 в §3, D2 в Этап 0.5 + DoD.
63|4. **Отчёт:** `docs/REPORT-01-otvet-hermes.md`.
64|
65|**Открыто (ждут владельца):** VM для S4 (рекомендую взять); юрист (AGPL §13, Enterprise-файлы, 006b, права на код/обои/логотип старого форка); `smb/brand/BRAND.md` с палитрой; результат M1/M2 — после запуска A2.
66|
67|---
68|
69|## Запись 01 — 2026-10-09, ~09:30–10:20 (Hermes)
70|
71|**Источники:** папки `SandBox/twenty-core`, `SandBox/new-crm`, `SandBox/agent-harnesses/note-document-212`; ответ Sonnet `pasted_content_2026-10-09_06-25-30-964_306f77.txt` («Оценка отчётов и переписанные промпты 4–8»).
72|
73|**Сделано Hermes:**
74|1. Проанализированы три папки (агентские выжимки: аудит Б24/blueprint — 14 .md; разбор smb-skin — механизмы/пути).
75|2. **Ключевые находки:** рабочее дерево `SandBox/new-crm` **пустое** (0 файлов `twenty-front/src`, git-индекс пуст); код старого форка (smb-skin, doc-management, messenger, company-tunnel) существует **только** в `SandBox/twenty-dev/new-crm` @ `origin/master 9ffddb1b59` (95 путей smb-skin — проверено `git ls-tree`).
76|3. Создан `docs/PLAN-fork-work.md` (v1, затем v2 — см. запись 02).
77|4. В память Hermes сохранено: расположение источника и пустота new-crm.
78|
79|**Состояние проекта на начало записи 02:**
80|
81|| Объект | Состояние |
82||---|---|
83|| `SandBox/twenty-core` | Форк Twenty `twenty/v2.45.6`; remotes: origin=github HaiiroShizumu/new-crm, upstream=twentyhq (no_push); CI `fork-ci.yaml` + `check-core-patches.sh`; PATCHES.md (P-001); 7 ADR («Поправки» не вшиты); **рабочее дерево: незакоммиченные доки/скрипты** (docs/adr, docs/arch/02-*, docs/dev, docs/ops, fork-release.yaml, verify-citations.sh, smb/, PLAN, REPORT, CONTEXT-LOG); кода модулей нет; `docs/reports/` нет |
84|| `SandBox/new-crm` | Старый форк v2.42.6: рабочее дерево пустое, ветка без коммитов, stash битый; `AUDIT.md` (4 критичных дефекта) сохранён |
85|| `SandBox/twenty-dev/new-crm` | **Единственный носитель кода старого форка** (origin/master `9ffddb1b59`); защищён bundle-архивом |
86|| `SandBox/backups/` | smb-skin tar.gz (sha256 `1109f09d…`) + полный bundle 1.79 ГБ |
87|| Спайки A2/D2/S1–S5 | **Не начинались** (`docs/reports/` нет) |
88|| План | `docs/PLAN-fork-work.md` **v2** — к передаче исполнителю только после Этапа 0.5 |
89|| Отчёты Hermes | `REPORT-01-otvet-hermes.md` (ответ на критику) |
90|
91|**Открыто:** см. запись 02.
92|
93|---
94|
95|## Контекст до 2026-10-09 (кратко)
96|
97|- Аудит Битрикс24 и blueprint (`note-document-212`), baseline-анализ Twenty, 7 ADR и реестр PATCHES созданы ранее (2026-10-08/09) — всё в `docs/`.
98|- Ответы Sonnet от 2026-10-07 и ранее лежат в `~/.hermes/composer-pastes/` (файлы `2026-10-07_*`); в эту нить они не переносились.
```
