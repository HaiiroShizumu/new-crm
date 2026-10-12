# Модуль форка: как добавить (ADR-009)

Руководство автора. Решения — `docs/adr/ADR-009-module-contract.md`, очередь —
`../TODO.md` §2. Статус проверок: где написано **NOT RUN** — команда не выполнялась
(нет Linux-VM/стека), это не «работает».

## 1. Три части, один ключ

```
smb-<key>
├── app/     packages/twenty-apps/smb/<key>/                        данные: объекты, поля, вью, роли, workflows, пункты меню
├── server/  packages/twenty-server/src/modules/smb-<key>/          (не всем) PRE-хуки, резолверы, REST, свои таблицы
└── front/   packages/twenty-front/src/modules/smb-<key>/           (не всем) страницы, виджеты, embed-поверхность
```

Правило выбора (ADR-009 п.1): сначала `app/`; отказ в сохранении, свой API или своя
таблица — `server/`; экран, которому мало штатной таблицы/канбана/карточки — `front/`.
Части `server/` и `front/` есть не у всех модулей, часть `app/` — всегда: пустой App
служит выключателем и носителем ролей.

## 2. Каркас одной командой

```bash
yarn smb:module new <key> [--display-name "Название"] [--server]
yarn smb:module list
```

`key` — kebab-case в пределах `[a-z][a-z0-9-]{1,32}`. Команда создаёт:

| Что | Куда |
|---|---|
| App (package.json, tsconfig, `src/application-config.ts`, `src/roles/default-role.ts`, README) | `packages/twenty-apps/smb/<key>/` |
| манифест `manifest.ts` + страница `pages/<Name>Page.tsx` | `packages/twenty-front/src/modules/smb-<key>/` |
| import и элемент массива между маркерами | `packages/twenty-front/src/modules/smb-modules/registry.ts` |
| `--server`: Nest-заглушка, строка в `smb-server.module.ts` (если реестр есть) и запись в `docs/PATCHES.md` | `packages/twenty-server/src/modules/smb-<key>/` |

Всё, что генератор создал, лежит в наших каталогах — гейт `check-core-patches`
зелёный без ручных записей, кроме серверной части: OURS на сервер ещё не расширен
(задача M-1, ревью владельца), поэтому для неё генератор сам добавляет строку в
`docs/PATCHES.md`.

## 3. Манифест

```ts
export const SMB_ABSENCES_MODULE_MANIFEST = {
  key: 'absences',
  applicationUniversalIdentifier: '…uuid…', // App из app/
  dependsOn: ['org-structure'],
  routes: [{ path: '/absences', loader: () => import('@/smb-absences/pages/AbsencesPage') }],
  navigation: [{ labelKey: 'absences.title', icon: 'IconCalendarOff', to: '/absences', group: 'company' }],
  recordTabs: [],
  embed: null, // { path: 'embed/absences' } — виден во фрейме Б24 (ADR-008 п.6)
} as const satisfies SmbModuleManifest;
```

Правила:

- `path` — **абсолютный** (`/absences`) и уникален среди модулей: это строка
  `WorkspaceRouteObject`, конфликт с путём ядра разрешается в пользу ядра.
- `applicationUniversalIdentifier` — то же значение, что
  `APPLICATION_UNIVERSAL_IDENTIFIER` в `application-config.ts` App: по нему
  фронт решает, включён ли модуль.
- `dependsOn` участвует **только** в порядке установки пресета (ADR-006), на
  включение не влияет (ADR-009 п.3).
- `icon` — имя из `packages/twenty-ui/src/icon/icon-dictionary.md`.

## 4. Включён ли модуль

Один источник (ADR-009 п.3): **модуль включён тогда и только тогда, когда его App
установлен**. Отдельных feature-флагов нет.

- Хук `useIsSmbModuleEnabled('<key>')` — пункты меню, виджеты, вкладки.
- `useEnabledSmbModules()` — весь список включённых.
- Путаницы «флаг против установленного App» нет, потому что список один.
- `SmbModuleRouteGate` перекрывает страницу модуля, если App не установлен:
  адрес ведёт себя как несуществующий.

Серверная половина правила — guard `@RequireSmbModule('<key>')` (задача M-4,
**NOT RUN**: нужен серверный шов P-002 и ревью владельца).

## 5. Проверка перед коммитом

```bash
node_modules/.bin/tsgo -p packages/twenty-front/tsconfig.json --noEmit   # штатная команда из U-1
node_modules/.bin/tsc -p packages/twenty-front/tsconfig.json --noEmit    # где бинарь tsgo недоступен (linux-arm64)
node scripts/smb-module.mjs list
bash scripts/check-core-patches.sh --staged
npx jest packages/twenty-front/src/modules/smb-modules --config=packages/twenty-front/jest.config.mjs
```

Установка App на чистой компании, upgrade и uninstall — спайк **S1** (ADR-009
«Что нужно проверить» №1), **NOT RUN** без стека.

## 6. Чего здесь пока нет

- **Установка/выключение с командной строки** (M-6): `smb:preset install|list`,
  `smb:module disable` — нужны работающий инстанс и БД, **NOT RUN**.
- **Проверка «версия App ↔ версия кода в образе»** (M-7) — при старте сервера.
- **Меню и оболочка** (U-2): `navigation` манифеста читает оболочка, её ещё нет —
  пока пункт меню модуля не появится, даже если App установлен.
- **Серверный реестр** `smb-server.module.ts`: создаётся швом P-002 (M-1) после
  прототипа Discovery A2 и ревью владельца; до этого `--server` пишет заглушку и
  предупреждение.
- **embed-поверхность** (`embed` в манифесте) — задача U-5, маршрут `/embed/<module>`.
