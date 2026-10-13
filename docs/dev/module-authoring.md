# Модуль форка: как добавить (ADR-009)

Руководство автора. Решения — `docs/adr/ADR-009-module-contract.md`, очередь —
`../TODO.md`. Статус проверок: где написано **NOT RUN** — команда не выполнялась
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
| `--server`: Nest-заглушка, строка в `smb-server.module.ts` (если реестр есть) | `packages/twenty-server/src/modules/smb-<key>/` |
| `--server`: пустой список миграций `migrations/smb-<key>.migrations.ts` и две строки (импорт, спред) в реестре миграций | `packages/twenty-server/src/modules/smb-database/registry.ts` |
| манифест `{ key, applicationUniversalIdentifier, expectedVersion }` | `packages/twenty-server/src/modules/smb-modules/registry.ts` |

Всё, что генератор создал, лежит в наших каталогах (`smb-*` на сервере и
фронте — OURS с 2026-10-12, `packages/twenty-apps/smb/`, `scripts/`, `docs/`) —
гейт `check-core-patches` зелёный без ручных записей; для App генератор
оставляет страховочную запись в `docs/PATCHES.md` (P-018), только если её ещё
нет. Серверный манифест вставляется **всегда, и без `--server`**: по нему
guard находит App модуля, а сверка версии при старте читает `expectedVersion`.

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

Серверная половина правила — guard `@RequireSmbModule('<key>')` (M-4, готов):

```ts
import { RequireSmbModule } from 'src/modules/smb-modules/decorators/require-smb-module.decorator';

@RequireSmbModule('absences')
class AbsencesResolver {}
```

- ключ берётся из `packages/twenty-server/src/modules/smb-modules/registry.ts`
  (строку вставляет генератор): неизвестный ключ — отказ, а не пропуск;
- источник правды — установленный App, те же правила RV-2, что на фронте:
  App с `state ≠ INSTALLED`, без `version` (установка не завершена) или с
  soft-delete считается выключенным;
- кэш установленных App держится 10 с и сбрасывается `invalidate()` из нашего
  кода; `disable` в другом процессе кэш не трогает — работает TTL;
- guard подключён швом P-002 (`SmbServerModule` → `SmbModulesModule`); без
  него он отказывает с сообщением про шов.

### Платформенные модули

`smb-notifications` и `smb-conversations` есть в каждой компании и App-выключателя не имеют.
У такого модуля на сервере нет `@RequireSmbModule` и строки в `smb-modules/registry.ts`, а в манифесте
фронта стоит `isPlatform: true`: `filterEnabledSmbModules` считает его включённым без сверки с
установленными App. Генератор `yarn smb:module new` платформенные модули не создаёт — каталоги и
строки в реестрах добавляются вручную (образец — `smb-conversations`). Делать модуль платформенным
только по решению в ADR: всё остальное включается установкой App.

## 5. Свои таблицы (ADR-013 п.2)

Таблицы серверной части модуля живут в схеме `smb` и создаются **миграциями
форка**, а не instance-командами Twenty: конвейер обновлений идёт по курсору и
команду, добавленную в уже пройденную версию, на живом сервере не выполнит.
Генератор с `--server` создаёт пустой список `SMB_<KEY>_MIGRATIONS` и уже
подключает его в `smb-database/registry.ts`; остаётся дописать миграции:

```ts
export const SMB_ABSENCES_MIGRATIONS: SmbMigration[] = [
  {
    name: 'absences/0001-create-absence-table',
    up: async (queryRunner) => {
      await queryRunner.query(`CREATE TABLE "smb"."absence" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" uuid NOT NULL,
        CONSTRAINT "PK_smb_absence_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_smb_absence_workspaceId" FOREIGN KEY ("workspaceId")
          REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`);
    },
  },
];
```

- имя — `<модуль>/<NNNN>-<что делает>`; учёт ведётся по имени в журнале
  `smb._migration`, порядок задаёт порядок в списке;
- **применённую миграцию не править** — менять схему только новой миграцией;
- у каждой таблицы `"workspaceId" uuid NOT NULL` и
  `REFERENCES "core"."workspace"("id") ON DELETE CASCADE` — удаление компании
  чистит её данные, ни одна таблица не живёт без привязки к компании;
- доступ к таблице — только через репозиторий-обёртку, где `workspaceId` —
  обязательный первый аргумент (образец —
  `smb-notifications/repositories/smb-notification.repository.ts`);
- instance-команды (`@RegisteredInstanceCommand`) и `@MetadataResolver` в
  `smb-*` не писать: это проверяет тест-страж
  `smb-modules/__tests__/smb-forbidden-decorators.spec.ts`.

## 6. Проверка перед коммитом

```bash
node_modules/.bin/tsgo -p packages/twenty-front/tsconfig.json --noEmit   # штатная команда из U-1
node_modules/.bin/tsc -p packages/twenty-front/tsconfig.json --noEmit    # где бинарь tsgo недоступен (linux-arm64)
node scripts/smb-module.mjs list
bash scripts/check-core-patches.sh --staged
npx jest packages/twenty-front/src/modules/smb-modules --config=packages/twenty-front/jest.config.mjs
npx jest smb-modules --config=packages/twenty-server/jest.config.mjs --maxWorkers=1   # guard и сверка версий (M-4/M-7)
(cd packages/twenty-server && npx oxlint -c .oxlintrc.json src/modules/smb-modules)
node --test scripts/test/smb-preset.test.mjs scripts/test/smb-module.test.mjs   # порядок пресета (M-6), генератор (AR-5)
```

Установка App на чистой компании, upgrade и uninstall — спайк **S1** (ADR-009
«Что нужно проверить» №1), **NOT RUN** без стека.

## 7. Чего здесь пока нет

- **Установка/выключение с командной строки** (M-6): команды есть —
  `yarn smb:preset list|install <preset> [--dry-run]` и
  `yarn smb:module disable <key> [--workspace <uuid>] [--dry-run]`
  (`--delete-data --yes` — удаление данных, только через API и с подтверждением).
  Проверено: порядок пресета по `dependsOn`, снятие назначений ролей на
  выделенной БД, предохранители `--delete-data`. **NOT RUN**: реальная установка
  пресета — нужен работающий инстанс с установленными App и `SMB_API_TOKEN`;
  файл пресетов `packages/twenty-apps/smb/presets.json` пока пуст.
- **Меню и оболочка** (U-2): `navigation` манифеста читает оболочка, её ещё нет —
  пока пункт меню модуля не появится, даже если App установлен.
- **embed-поверхность** (`embed` в манифесте) — задача U-5, маршрут `/embed/<module>`.

Что уже есть: **сверка «версия App ↔ версия кода в образе»** (M-7) выполняется
при старте сервера (`SmbModulesVersionCheckService.onModuleInit`): расхождение —
`logger.warn`, а результат сверки отдаёт `GET /healthz/smb` (`status`:
`ok` / `warning` / `not_checked`, список расхождений; штатный `/healthz`
не тронут, правки ядра нет — AR-8). Серверный
реестр `packages/twenty-server/src/modules/smb-server.module.ts` и шов P-002
сделаны — `--server` больше не пишет предупреждений.
