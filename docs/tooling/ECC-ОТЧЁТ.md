# ОТЧЁТ: установка ECC в стек «Hermes Agent + Cursor IDE + бесплатный Claude (советник)»

Дата: 2026-10-08 · Источник: `github.com/affaan-m/ECC` (v2.2.3, MIT) · Каталог: `/Users/haiiro/SandBox/agent-harnesses`

---

## 1. Что сделано (факты, не обещания)

### Установлено три адаптера ECC

| Цель | Профиль | Модули | Куда | Файлов |
|---|---|---|---|---|
| **cursor-project** | `developer` | rules-core, agents-core, commands-core, **hooks-runtime**, platform-configs, framework-language, database, skill-unified-memory, workflow-quality | `<папка>/.cursor/` | 867 |
| **claude-project** | `minimal` | rules-core, agents-core, commands-core, platform-configs, skill-unified-memory, workflow-quality | `<папка>/.claude/` | 491 |
| **hermes-home** | `minimal` | те же 6 модулей без hooks-runtime | `~/.hermes/` | 1031 |

Команды, которыми это сделано (воспроизводится `setup.sh`):

```bash
./ECC/install.sh --profile developer  --target cursor        --enable-hooks   # в <папке>
./ECC/install.sh --profile minimal    --target claude-project                # в <папке>
./ECC/install.sh --profile minimal    --target hermes                        # в ~/.hermes
```

### Что конкретно лежит в каждой точке

- **`.cursor/rules/` — 121 правило** `.mdc` с YAML-фронтматтером (`alwaysApply: true` либо `globs:`).
  Это и есть основная ценность для Cursor: стиль кода, тесты, git-workflow, производительность,
  языковые пакеты (TypeScript/Go/Kotlin/Swift и др.).
- **`.cursor/agents/` — 68 агентов** `ecc-*.md` (префикс `ecc-` чтобы не коллидовать с вашими).
  Видны в Cursor Agent picker, каждый со своим промптом и списком инструментов.
- **`.cursor/hooks.json` + `.cursor/hooks/` (17 обёрток) + `.cursor/scripts/` (234 файла рантайма)** —
  автоматика на событиях: блокировка `git commit --no-verify`, авто-формат и TypeScript-проверка
  после правки файла, предупреждение про `console.log`, защита от обхода git-хуков, аудит MCP-вызовов,
  напоминание про ревью перед `git push`, сбор session-состояния.
- **`.claude/`** — проектная поверхность для Claude Code: `AGENTS.md`, `agents/`, `commands/`,
  `skills/` (48 скиллов), `rules/`, `settings.json` (`includeCoAuthoredBy: false`), `mcp-configs/`.
- **`~/.hermes/`** — 48 ECC-скиллов (`~/.hermes/skills/`), команды, правила, агенты,
  `AGENTS.md`, `ecc-install-state.json`.
- **`.ecc/memory/`** — инициализирован общий Memory Vault, scope `project` и `team`.
  В него сохранён ранбук по этой установке: `mem_20261008_f7a5bf87d83f46a88a7e`.

### Найдена и исправлена реальная проблема установщика

Адаптер хуков Cursor (`.cursor/hooks/adapter.js`) делает
`path.join(getPluginRoot(), 'scripts', 'hooks', scriptName)`, где `getPluginRoot` — **корень проекта**.
Установщик же кладёт рантайм в `<проект>/.cursor/scripts/hooks/`. В результате все 17 хуков
**молча не выполнялись** (ошибка глотается, exit 0) — это известный gap адаптера
(в README ECC: «install-path differences remain», issue #2419).

**Решение:** создан симклинг в корне папки:

```
scripts -> .cursor/scripts
```

После этого хуки реально работают — проверено запуском:

- `before-shell-execution-block-no-verify.js` с `git commit --no-verify` → **exit 2, «BLOCKED: --no-verify flag is not allowed»** (Cursor прерывает команду);
- тот же хук с чистым `git commit -m x` → exit 0, пропуск;
- `session-start.js` → exit 0 и созданы `~/.cursor/ecc/session-data`, `~/.cursor/ecc/skills/learned`
  (при `CURSOR_VERSION` заданном — данные уходят в `~/.cursor/ecc`, а не в `~/.claude`,
  как и задумано для изоляции Cursor от Claude Code).

### Проверки

- `node ECC/scripts/ecc.js doctor` → **checked=3, ok=3, warnings=0, errors=0** (все три цели).
- `node ECC/scripts/ecc.js list-installed` → все три установки видны с профилями и модулями.
- `node ECC/scripts/ecc.js memory search "ECC setup"` → находит сохранённый ранбук.
- **Hermes реально подхватил скиллы**: `skills_list` теперь отдаёт **138 скиллов**
  (было 90, стало +48 ECC: `architecture-decision-records`, `intent-driven-development`,
  `verification-loop`, `tdd-workflow`, `santa-method`, `product-lens`, `production-audit`,
  `unified-memory`, `ecc-guide`, `context-budget`, …).
- Тесты самого ECC (`node tests/run-all.js`) — **пройдены полностью: Total 6195, Passed 6195, Failed 0, exit 0** (лог в `ECC-testrun.log`).

### Что осталось нетронутым

- Не ставился Claude-плагин (`ecc@ecc`) и не выполнялась ручная установка в `~/.claude` —
  вы Claude Code как харнесс не используете, а дублирование методов установки запрещено самим ECC.
- Не включался глобальный `npm install -g ecc-universal` — всё делается через
  `node ECC/scripts/ecc.js ...` из папки.
- Ваш `~/.hermes/config.yaml`, плагины, крон и профили не менялись (менялся только каталог `skills/` + добавлены ECC-файлы).

---

## 2. Как пользоваться

### Hermes (основной агент, глобально)

ECC-скиллы уже в списке. Обращайтесь к ним по имени, например:

- «запиши ADR» → `architecture-decision-records`
- «сформулируй критерии приёмки этой фичи» → `intent-driven-development`
- «прогони верификацию: сборка, типы, линт, тесты, безопасность» → `verification-loop`
- «TDD по этому фичу» → `tdd-workflow`
- «что ECC знает про …» → `ecc-guide` (читает живое репо, а не память)
- «какой набор команд закрывает мой процесс» → `ecc-recipes`
- «пережимаем контекст» → `context-budget`, «осторожный релиз» → `santa-method`

Что в `~/.hermes` **не** подхватывается самим Hermes (лежит, но inert): `rules/`, `commands/`,
`agents/`, `.agents/`, `AGENTS.md`. Это нормально — они для Claude/Codex-совместимости.
Хуков у Hermes от ECC нет: рантайм хуков есть только у Claude Code и Cursor.

Память между агентами:

```bash
node ECC/scripts/ecc.js memory save --title "…" --kind decision --stdin   # запись
node ECC/scripts/ecc.js memory search "…" --scope project                 # поиск
node ECC/scripts/ecc.js memory handoff --from hermes --target cursor --title "…" --stdin
```

### Cursor IDE

1. Открыть папку `agent-harnesses` в Cursor.
2. Правила подхватываются автоматически (`alwaysApply` — всегда, остальные — по glob).
3. Агенты `ecc-*` — в списке агентов (Agent picker).
4. Хуки: проверьте, что в Cursor включены **project hooks** (Settings → Beta / MCP & Hooks).
   Тогда после старта сессии появится `~/.cursor/ecc/`, а `git commit --no-verify` будет блокироваться.
5. Cursor предложит MCP-сервер `chrome-devtools` из `.cursor/mcp.json` — можно отклонить/удалить, он не обязателен.

Переключение строгости хуков (через env):

```bash
export ECC_HOOK_PROFILE=minimal|standard|strict
export ECC_DISABLED_HOOKS=session-end,after-file-edit
```

### Бесплатный Claude (роль «архитектурный советник»)

- **Как claude.ai (чат)** — подписка не нужна вообще. Рабочий режим: дать задачу на архитектуру,
  получить разбор, вернуть решение мне/в Cursor на реализацию.
- **Как Claude Code в этой папке** — подхватит `.claude/` (AGENTS.md, 48 скиллов, агенты, команды).
  Но: Claude Code **не работает на бесплатном тарифе** (см. §4), и каждый старт сессии
  съедает часть лимита на контекст. Поэтому `.claude/` держите для редких архитектурных
  сессий либо удалите папку — на работу Cursor/Hermes это не влияет.

### Администрирование

```bash
node ECC/scripts/ecc.js doctor          # целостность установки
node ECC/scripts/ecc.js repair          # восстановить «уплывшие» файлы
node ECC/scripts/ecc.js list-installed  # что и как установлено
node ECC/scripts/ecc.js consult "…" --target cursor   # подобрать компоненты по задаче
node ECC/scripts/ecc.js install --profile core --target cursor --dry-run   # план без записи
node ECC/scripts/ecc.js auto-update     # обновить ECC и переустановить managed-файлы
node ECC/scripts/ecc.js uninstall --target cursor-project|claude-project|hermes-home
```

⚠️ `repair`/`auto-update` перезапишут любой ручной правкой файлы, помеченные как managed
(например, если править `.cursor/hooks/adapter.js`). Симклинг `scripts` managed-файлом не является,
его они не трогают.

---

## 3. Что изучить перед использованием (в порядке выгоды)

1. **`ECC/the-shortform-guide.md`** (16 КБ) — самое плотное введение в философию ECC:
   research-first, верификация, чем ECC отличается от «просто промптов».
2. **`ECC/AGENTS.md` + `ECC/CLAUDE.md`** — как ECC заставляет вести себя агента:
   это ваш будущий «конституционный» слой и для Cursor, и для Claude.
3. **Скилл `ecc-guide`** (уже в Hermes) — справка по живой поверхности репозитория:
   какие скиллы/команды/правила существуют и как ставятся.
4. **`ECC/commands/` (94 команды)** и скилл `ecc-recipes` — группы команд под процесс:
   план → TDD → security-review → build-fix → verification. Начните с `/plan`, `/tdd`,
   `/security-review`, `/verify` (в Cursor это команды из `.cursor/commands/`).
5. **`docs/HERMES-SETUP.md`** — официальная топология «Hermes как входная дверь, ECC как подложка»:
   где что лежит, порядок внедрения, Memory Vault.
6. **Память агентов:** раздел «Shared Memory» в `docs/HERMES-SETUP.md` + скилл `unified-memory`.
   Правило: воспоминания ECC — это *контекст, а не инструкции*, всё проверяйте по исходникам/тестам.
7. **Хуки и профили:** `ECC/hooks/`, `ECC_HOOK_PROFILE`, `.cursor/hooks.json`.
   Понять, что именно авто-делается без вашего ведома (форматирование, блокировки, пуш).
8. **`ECC/the-security-guide.md`** (30 КБ) + `agent.yaml` — безопасность цепочки поставок:
   ставить только с официального репо/npm, `--ignore-scripts`, AgentShield-сканы.
9. **Контекст-бюджет:** скилл `context-budget` — обязателен, если работаете на бесплатных
   лимитах: показывает, что именно съедает окно.
10. **Тюнинг под свой проект:** скиллы `agent-sort` (разложить ECC на DAILY vs LIBRARY),
    `rules-distill`, `config-gc` — ECC не обязан жить целиком, его можно обрезать под стек.

---

## 4. Насколько обязательна подписка Claude Code Pro

**Коротко: для самого ECC — не обязательна вообще; для запуска Claude Code как харнесса — обязательна; для роли «советника» — не нужна.**

### ECC (репозиторий, который вы прислали)

- **ECC OSS — MIT, бесплатно и навсегда.** По заявлению автора, это «не freemium-заглушка, а
  сам продукт»: полная библиотека скиллов (138+), все агенты, все команды, production-хуки,
  кросс-харнесс поддержка, AgentShield CLI. Этого хватает на 99% задач.
- **ECC Pro — $19/seat/мес** — это *хостируемый GitHub App*, а не функции в CLI.
  Он нужен только для: анализа **приватных** репозиториев, PR-триггерных аудитов,
  50 анализов на сид в месяц, непрерывного сканирования безопасности на каждом PR, приоритетной поддержки.
  Локальная работа в папке/публичные репо — бесплатно.
- **Вывод:** при вашей схеме (Hermes + Cursor + локальная песочница) платить ECC ничего не нужно.

### Claude Code

- Claude Code **не работает на бесплатном тарифе claude.ai** (в таблице тарифов у Free — «No»).
- Варианты: **Pro $20/мес** ($17 при годовой оплате) — «10–40 промптов Claude Code за 5 часов»,
  до 40–80 часов Sonnet в неделю; **Max 5x $100**, **Max 20x $200**; либо **API-ключ Console**
  (оплата по токенам, без подписки).
- Ограничения Pro/Max общие для claude.ai и Claude Code — всё считается в один лимит.
- **Если Claude у вас только «за советами по архитектуре» — подписка не нужна:**
  бесплатного claude.ai хватает для разбора архитектурных вопросов в чате.
  Ставить тогда `Pro` стоит ровно в одном случае: если захотите запускать именно Claude Code
  (терминал/агентный режим) чаще пары раз в неделю.

### Cursor

- Правила, агенты и **хуки локальны и бесплатны** — они исполняются у вас на машине.
- Платятся только запросы к моделям (тариф Cursor) — ECC на лимиты Cursor влияет
  лишь тем, что rules/agents добавляют контекст к каждому запросу.

---

## 5. Насколько этот репозиторий вам поможет и какой шанс «настроить всё правильно»

### Польза для вашего стека

**Высокая, но неравномерная.**

- **Cursor — главный выигрыш.** 121 правило + 68 агентов + работающие хуки превращают Cursor
  из «редактора с чатом» в систему с дисциплиной: авто-проверка после правок, блокировка
  обхода git-хуков, ревью-гейты, готовые агенты под задачи.
- **Hermes — средний, но растущий.** 48 качественно написанных скиллов (ADR, верификация, TDD,
  аудит продакшена, продуктовая диагностика, мульти-модельный «совет») прямо усиливают меня
  как исполнителя. Сам адаптер объявлен автором *experimental/minimal*: часть файлов
  (`rules/`, `commands/`, `agents/`) Hermes не читает — это не поломка, а граница адаптера.
- **Claude — опциональный.** `.claude/` даёт то же самое внутри Claude Code, но при
  ограниченных бесплатных лимитах он скорее потребитель, чем источник выгоды.
- **Совместная память (`.ecc/memory`)** — единственная штука, которая физически связывает
  три инструмента: что я записал, прочитает Cursor/Claude, и наоборот.

Чего от ECC **не** ждите: это не генератор архитектуры и не замена модели. Это слой
*процессов и ограничений* вокруг любой модели. Качество результата по-прежнему определяет
модель, которая всё это исполняет.

### Шанс, что вы настроите всё правильно сами

Два разных вопроса:

1. **Просто поставить ECC по README** — очень высокий, ~90%: это одна-две команды на харнесс,
   ошибиться трудно, `ecc doctor` сразу скажет, если что-то не так.
2. **Настроить правильно *под свою задачу* (профили, объёмы, хуки, окружение, лимиты)** —
   заметно ниже, **~50–60%**. Реальные подводные камни, с которыми я столкнулся или которые
   заявлены в самих доках:
   - **хуки Cursor в хост-проекте не находят свой рантайм** и *молча* ничего не делают —
     вы бы просто не получил автоматику и не понял бы почему (исправлено симлингом, §1);
   - запрет «не складывать два метода установки в один харнесс» — легко сломать,
     например, поставив и плагин `ecc@ecc`, и ручную установку в Claude;
   - **перегрузка контекста**: профили `core/developer/full` тянут сотни файлов, что на
     Cursor/Hermes/Claude съедает лимиты — нужна дисциплина «минимальный профиль + обрезка»;
   - env-переменные (`ECC_HOOK_PROFILE`, `ECC_DISABLED_HOOKS`, `ECC_AGENT_DATA_HOME`)
     иначе данные Cursor и Claude смешиваются в `~/.claude`;
   - апдейтер `repair`/`auto-update` перезаписывает ручные правки managed-файлов;
   - адаптеры Cursor (beta) и Hermes (experimental) **не имеют паритета с Claude Code** —
     рассчитывать на «одинаково везде» нельзя;
   - проект — фактически работа одного мейнтейнера: ставить только с официального репо/npm
     (сам ECC предупреждает о вредоносных зеркалах).
   - **С этим отчётом, `setup.sh` и регулярным `ecc doctor` шанс держать всё корректным — ~90%.**

### Итоговая рекомендация

Оставить как установлено и использовать так: **Hermes — исполнитель, Cursor — место написания
кода с автоматикой ECC, бесплатный Claude — узкий консультант по архитектуре в чате.**
Подписки ECC Pro не нужна. Claude Code Pro нужна только если захотите запускать именно
Claude Code как второго агента; тогда дешёвый вход — Pro $20/мес, альтернатива — API Console
по токенам. Первую неделю держите профили `minimal` и раз в пару дней смотрите
`node ECC/scripts/ecc.js doctor` и скилл `context-budget`.
