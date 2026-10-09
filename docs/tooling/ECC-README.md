# agent-harnesses — рабочая площадка ECC + Hermes + Cursor + Claude

Песочница для настройки стека ИИ-агентов на основе репозитория
[ECC v2.2.3](https://github.com/affaan-m/ECC) (MIT).

```
agent-harnesses/
├── ECC/                  клон официального репо ECC (97 МБ, свой .git) — источник файлов и CLI
├── .cursor/              867 файлов — адаптер Cursor (профиль developer, хуки включены)
│   ├── rules/            121 правило .mdc (alwaysApply / по glob)
│   ├── agents/           68 агентов ecc-*.md (появляются в Cursor Agent picker)
│   ├── skills/           131 файл скиллов
│   ├── hooks.json + hooks/  17 обёрток хуков + адаптер Cursor→Claude формат
│   ├── scripts/          234 файла рантайма хуков (hooks/ 56 + lib/ 178)
│   ├── mcp.json          chrome-devtools MCP (можно отключить)
│   └── ecc-install-state.json   состояние установки (для doctor/repair/uninstall)
├── .claude/              491 файл — проектная установка для Claude Code (профиль minimal)
├── .ecc/memory/          общий Memory Vault (project + team) для Hermes/Cursor/Claude
├── scripts -> .cursor/scripts   ← СИМКЛИНГ: без него хуки Cursor ищут scripts/hooks в корне
│                                  и молча не выполняются (см. ОТЧЁТ.md, п.1)
├── setup.sh              воспроизводимая установка всех трёх адаптеров
├── ОТЧЁТ.md              полный отчёт: что сделано, как пользоваться, что изучать, про подписки
└── ECC-testrun.log       лог прогонов тестов ECC
```

Глобально (не в этой папке):

```
~/.hermes/                адаптер Hermes (профиль minimal): 48 ECC-скиллов,
                          команды, правила, агенты + ecc-install-state.json
~/.cursor/ecc/            данные хуков ECC для Cursor (session-data, learned skills)
```

## Быстрый старт

```bash
# 1. Проверить целостность установки (должно быть 3/3 OK)
node ECC/scripts/ecc.js doctor

# 2. Найти, какие компоненты ECC подходят под задачу
node ECC/scripts/ecc.js consult "security review" --target cursor

# 3. Общая память агентов
node ECC/scripts/ecc.js memory search "setup"
```

Откатить всё:

```bash
node ECC/scripts/ecc.js uninstall --target cursor-project
node ECC/scripts/ecc.js uninstall --target claude-project
node ECC/scripts/ecc.js uninstall --target hermes-home
```
