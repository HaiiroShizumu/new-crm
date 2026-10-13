# TODO: документооборот и канал Б24 (очередь для Hermes)

> Версия 2 от 2026-10-13. Прежний список (блоки A–E) разобран в `docs/reports/R15.md`: проверки и
> архитектурные места закрыты там, здесь осталось только то, что делается написанием кода и запуском
> команд. Прежняя версия файла есть в истории git (`git log -- docs/TODO-docflow.md`).

Решения приняты в `docs/adr/ADR-015-bitrix-channel.md` и `docs/adr/ADR-016-docflow.md`, уточнения
к ним в `docs/reports/R15.md`. Прочитать R15 целиком до первой задачи. Архитектуру не менять: если
задача упирается в решение, остановиться и записать вопрос в отчёт.

## Правила

- Рабочий каталог один: `/workspace/twenty-core`. Все команды `yarn`, `npx`, `jest` только в
  контейнере.
- Одна задача = один коммит = один отчёт `docs/reports/R<NN>.md` (следующий номер R16) + запись
  сверху в `docs/CONTEXT-LOG.md`. Формат отчёта: Сделано / Подтверждено / NOT RUN / Расхождения /
  Вопросы. В «Подтверждено» только то, что запускалось, с выводом команды.
- Отметка `[x]` ставится вместе со ссылкой на отчёт.
- Перед правкой открыть 2–3 соседних файла того же каталога и писать так же (имена, импорты, стили
  через `styled` из `@linaria/react`, тексты через `useLingui`). Тексты интерфейса на русском, как
  в остальных файлах модуля.
- В одном файле одна экспортируемая константа (правило линтера `max-consts-per-file`).
- Кнопки: `Button` из `twenty-ui/primitives/input` (`variant="solid" | "outline"`, `size="sm"`),
  `LightIconButton` из `twenty-ui/components` (обязателен `aria-label`). Иконки только из
  `twenty-ui/icon`.
- Переходы по страницам через `<Link>`, не через `navigate()`.
- Файлы ядра не трогать. Нужна правка вне наших каталогов (`CLAUDE.md`, раздел «Форк») —
  остановиться и написать вопрос.
- `locales/*.po` и `locales/generated/*` не коммитить.
- В коммитах никаких подписей ИИ.
- Порядок задач: сверху вниз. Задачи одного блока независимы, кроме отмеченных «после H-…».

Проверка после задачи фронта:

```bash
cd /workspace/twenty-core/packages/twenty-front
npx oxlint -c .oxlintrc.json src/modules/smb-docflow src/modules/smb-embed
npx oxfmt --check src/modules/smb-docflow src/modules/smb-embed
cd ../.. && NODE_ENV=test npx jest packages/twenty-front/src/modules/smb-docflow --config=packages/twenty-front/jest.config.mjs --maxWorkers=1 --coverage=false
```

Проверка после задачи сервера:

```bash
cd /workspace/twenty-core/packages/twenty-server && npx oxlint -c .oxlintrc.json src/modules/smb-bitrix
cd ../.. && npx jest packages/twenty-server/src/modules/smb-bitrix --config=packages/twenty-server/jest.config.mjs --maxWorkers=1
```

`tsgo` по пакету целиком запускать один раз в конце блока, не после каждой задачи:
`cd packages/twenty-front && GOMAXPROCS=2 nice -n 19 npx tsgo -p tsconfig.json --noEmit`. Перед
запуском `free -m`; если свободно меньше 2 ГБ, записать `NOT RUN` и причину.

## Закрыто

- [x] A1, A2, A3, A5 — `docs/reports/R13.md`.
- [x] A4 — `docs/reports/R14.md` (403 вместо 503: вопрос владельцу, R15 №2).
- [x] A6 — сценарий процесса пройден, 1,95 с (`docs/reports/R15.md`).
- [x] B1 — пункт меню приходит из манифеста, руками не заводится (`R15`). Остаток: H-1.
- [x] B6 — ключи `smb*` в `settings` поля переживают правку метки, стираются сменой типа (`R15`).
- [x] D5 — проект привязки сотрудников (`R15`, раздел D5). Код после решения владельца.

## H. Задачи Hermes

### Интерфейс заданий и процессов

Каталог: `packages/twenty-front/src/modules/smb-docflow/`. Образцы в нём же: компонент
`components/SmbDocflowTasksTab.tsx`, хук `hooks/useSmbDocflowTasks.ts`, утилита с тестом
`utils/getSmbMissingRequiredFields.ts`.

- [x] **H-1. Иконка пункта меню.** В `manifest.ts` заменить `icon: 'IconFileText'` на
  `icon: 'IconFiles'`. Готово: проверки фронта проходят, в отчёте одна строка diff.
  `docs/reports/R16.md`.
- [x] **H-2. Состояние загрузки.** Новый компонент `components/SmbDocflowListSkeleton.tsx`: 5 серых
  строк высотой как `SmbDocflowListRow`. В `SmbDocflowTasksTab.tsx` и `SmbDocflowProcessesTab.tsx`
  показывать его, пока `loading === true`, вместо пустого экрана. Библиотеку скелетонов не
  подключать, это пять `div` с фоном `themeCssVariables.background.tertiary`.
  `docs/reports/R17.md`.
- [x] **H-3. Кнопки «Создать» и «Изменить» на вкладке «Процессы».** «Создать» это `<Link>` на
  `/objects/workflows`, над списком. «Изменить» в `SmbDocflowProcessPreview.tsx` это `<Link>` на
  `getAppPath(AppPath.RecordShowPage, { objectNameSingular: 'workflow', objectRecordId: process.workflowId })`.
  Если `isSmbEmbedded()` (`@/smb-embed/utils/isSmbEmbedded`) возвращает `true`, обе кнопки не
  показывать. `docs/reports/R18.md`.
- [x] **H-4. Сортировка заданий.** Утилита `utils/sortSmbDocflowTasks.ts`: вход массив заданий,
  выход новый массив (исходный не менять), по `dueAt` по возрастанию, задания без срока в конце,
  при равенстве по `createdAt`. Тест `utils/__tests__/sortSmbDocflowTasks.test.ts`: со сроком и
  без, равные сроки, пустой массив, исходный массив не изменён. `docs/reports/R19.md`.
- [x] **H-5. Карточки «Ждут вас».** Новый компонент `components/SmbDocflowTaskCard.tsx`: название
  задания, название процесса (`task.workflowRunName`), срок (`formatDate(task.dueAt, 'dd.MM.yyyy')`
  из `~/utils/date-utils`, если срок есть), красная метка «Просрочено» по `isSmbDocflowTaskOverdue`.
  Карточка это `button`, клик вызывает `onClick`. В `SmbDocflowTasksTab.tsx` раздел «Ждут вас»
  показать карточками в один ряд с горизонтальной прокруткой (`overflow-x: auto`). Раздел
  «Остальные задания» не трогать. `docs/reports/R20.md`.
- [ ] **H-6. Таблица остальных заданий** (после H-4). Раздел «Остальные задания» сделать таблицей
  (`table`, `th`, `td`): задание, процесс, исполнитель, срок, создано. Имя исполнителя: хук
  `useFindManyRecords({ objectNameSingular: CoreObjectNameSingular.WorkspaceMember })`, сопоставить
  по `task.assigneeWorkspaceMemberId`, показать `name.firstName` и `name.lastName`; исполнителя нет
  — прочерк. Строки отсортировать через `sortSmbDocflowTasks`. Клик по строке выбирает задание, как
  сейчас.
- [ ] **H-7. Панель предпросмотра.** `components/SmbDocflowSplitLayout.tsx`: добавить проп
  `onClose: () => void` и кнопку закрытия (`LightIconButton` с `IconX`, `aria-label` «Закрыть») в
  правом верхнем углу панели. Анимация появления: `transition` ширины длительностью
  `calc(${themeCssVariables.animation.duration.normal} * 1s)`, как в
  `side-panel/components/SidePanelForDesktop.tsx:34-48` (тот файл только читать). На ширине меньше
  900px (`@media (max-width: 900px)`) панель `position: absolute; inset: 0` поверх списка. В обеих
  вкладках передать `onClose`, который сбрасывает выбранное.
- [ ] **H-8. Шаги процесса в предпросмотре задания.**
  1. Утилита `utils/getSmbDocflowRunTimeline.ts`: вход `state` запуска (тип из `WorkflowRun['state']`),
     выход массив `{ stepId, name, status }` в порядке `state.flow.steps`; статус из
     `state.stepInfos[step.id]?.status`, если его нет — `'NOT_STARTED'`. Тест по образцу
     `utils/__tests__/getSmbDocflowTasksFromRun.test.ts`.
  2. Хук `hooks/useSmbDocflowRunState.ts`: `useFindOneRecord` по `CoreObjectNameSingular.WorkflowRun`
     с `recordGqlFields: { id: true, status: true, state: true }`, затем
     `workflowRunSchema.safeParse` (как в `useSmbDocflowTasks.ts`); при неуспехе вернуть `undefined`.
     Штатный `useWorkflowRun` не использовать: он бросает исключение на запуске с непривычным
     состоянием (R15).
  3. Под формой в `SmbDocflowTaskPreview.tsx` показать список шагов: название и статус.
- [ ] **H-9. Тесты формы.** `components/__tests__/SmbDocflowForm.test.tsx`: (1) при пустом
  обязательном поле `onSubmit` возвращает его, и на экране появляется текст «Заполните: …» с
  подписью поля; (2) у обязательного поля в подписи есть звёздочка; (3) поле с `settings.smbRole` не
  отображается. Обязательность задаётся через `settings: { smbIsRequired: true }`. Окружение теста
  взять из `packages/twenty-front/src/modules/workflow/workflow-steps/filters/components/__tests__/WorkflowStepFilterValueCompositeInput.test.tsx`.
  Запросы по видимому тексту и ролям, взаимодействие через `@testing-library/user-event`. Если
  `WorkflowFormFields` не рендерится в тесте без большого набора провайдеров, не подменять его
  заглушкой молча: записать в отчёт, чего не хватило.

### Канал Б24

- [ ] **H-10. Переменные в compose.** В `smb/deploy/docker-compose.yml` в блок
  `x-app-environment` (строка 15) после строк `STORAGE_S3_*` добавить
  `SMB_BITRIX_CLIENT_ID: ${SMB_BITRIX_CLIENT_ID:-}`, `SMB_BITRIX_CLIENT_SECRET: ${SMB_BITRIX_CLIENT_SECRET:-}`,
  `SMB_BITRIX_AUTO_PROVISION_WORKSPACE: ${SMB_BITRIX_AUTO_PROVISION_WORKSPACE:-false}`. Те же три
  имени с пустыми значениями добавить в `smb/deploy/.env.example`. Проверка
  `docker compose … config` в контейнере недоступна (Docker нет): записать `NOT RUN`, вместо неё
  из корня репозитория
  `node -e "require('yaml').parse(require('fs').readFileSync('smb/deploy/docker-compose.yml','utf8'),{merge:true});console.log('yaml ok')"`
  и вывод.
- [ ] **H-11. Документ для оператора** `docs/ops/bitrix-app.md`: что вписать в карточку приложения
  в кабинете вендора Б24. Адрес приложения `https://<корень>/webhooks/smb-bitrix/app`, адрес
  установки `…/install`, обработчик событий `…/event` для `ONAPPINSTALL` и `ONAPPUNINSTALL`, права
  `user`. Где взять `client_id` и `client_secret` и в какие переменные их положить (H-10). Что
  портал после установки остаётся `PENDING`, пока его не привязали командой из H-13. Только то, что
  следует из ADR-015 и кода `smb-bitrix`; чего там нет, не выдумывать.
- [ ] **H-12. Тест `SmbBitrixPortalService.isApplicationTokenValid`.** Файл
  `packages/twenty-server/src/modules/smb-bitrix/services/__tests__/smb-bitrix-portal.service.spec.ts`,
  зависимости заглушками по образцу `smb-bitrix-launch.service.spec.ts`. Случаи: верный токен →
  `true`; неверный → `false`; пустая строка и `undefined` → `false`; у портала
  `encryptedApplicationToken` пуст → `false`; `decryptVersionedOrThrow` бросает → `false`.
- [ ] **H-13. Команда привязки портала.** Файл
  `packages/twenty-server/src/modules/smb-bitrix/commands/smb-bitrix-bind-portal.command.ts`:
  `@Command({ name: 'smb:bitrix:bind-portal' })`, опции `--member-id <id>` и `--workspace-id <uuid>`
  (обе обязательные). Логика: `SmbBitrixRepository.findPortalByMemberId`; портала нет → сообщение
  в лог и `process.exitCode = 1`; есть → `SmbBitrixPortalService.bindToWorkspace(portal.id, workspaceId)`
  и строка в лог с итоговым статусом. Класс добавить в `providers` в `smb-bitrix.module.ts`. Файлы
  ядра не нужны (R15, раздел D4). Образец оформления:
  `src/modules/calendar/calendar-event-import-manager/commands/calendar-trigger-event-list-fetch.command.ts`.
  Тест рядом (`commands/__tests__/…spec.ts`): портал найден, портал не найден. Запуск на стенде
  требует пересборки сервера (`nx build`), это тяжёлое: записать `NOT RUN`.
- [ ] **H-14. Строки для перевода.** Собрать все строки из `smb-bitrix`, `smb-embed`, `smb-docflow`
  (всё, что в `` msg`…` `` и `` t`…` ``) в таблицу `docs/reports/R<NN>-strings.md`: файл, строка,
  текст, русский перевод (если текст уже русский, перевод тот же). Команда поиска в отчёт.

### Документы

Перед блоком прочитать в R15 раздел «Разбор блока C». Справка по составу старого модуля (только
читать, код не копировать, он под v2.42.6):
`../new-crm-master/packages/twenty-apps/internal/doc-management/src/`.

- [ ] **H-15. Приложение `docflow`.** Каталог `packages/twenty-apps/smb/docflow`, структура и
  служебные файлы (`package.json`, `tsconfig.json`, `.oxlintrc.json`, `.yarnrc.yml`, `.gitignore`,
  `README.md`, `src/roles/default-role.ts`) по образцу `packages/twenty-apps/smb/tasks`. В
  `package.json` имя `docflow`. Генератор `yarn smb:module` не запускать.
  - `src/application-config.ts`: `universalIdentifier: '0b7d5d2e-8c4f-4a59-9a43-2f6f1c3e9d21'`
    (уже стоит в `smb-docflow/manifest.ts`, менять нельзя), `displayName: 'Документооборот'`.
  - `src/universal-identifiers.ts`: по константе на каждую сущность, значения сгенерировать
    `node -e "console.log(crypto.randomUUID())"`.
  - Объект `smbDocumentFolder` (`src/objects/document-folder.object.ts`): `name` (TEXT, поле-подпись),
    `color` (SELECT: GRAY, BLUE, GREEN, ORANGE, RED, PURPLE; по умолчанию GRAY).
  - Объект `smbDocument` (`src/objects/document.object.ts`): `name` (TEXT, поле-подпись), `file`
    (FILES, `universalSettings: { maxNumberOfValues: 1 }`, образец
    `packages/twenty-apps/examples/document-generator/src/objects/document.object.ts:68-75`), `status` (SELECT: DRAFT, IN_REVIEW, APPROVED,
    ARCHIVED; по умолчанию DRAFT), `editorKind` (SELECT: NONE, UNIVER_SHEET, UNIVER_DOC; по
    умолчанию NONE), `editorSnapshot` (RAW_JSON, необязательное).
  - Связи, каждая парой файлов в `src/fields/` по образцу `time-entry-member.field.ts` и
    `member-time-entries.field.ts` из `tasks`: `smbDocumentFolder.parentFolder` ↔
    `smbDocumentFolder.childFolders`; `smbDocument.folder` ↔ `smbDocumentFolder.documents`;
    `smbDocument.author` ↔ `workspaceMember.smbAuthoredDocuments`; `smbDocument.responsible` ↔
    `workspaceMember.smbResponsibleDocuments`. Все many-to-one необязательные, `onDelete: SET_NULL`.
  - Вью: «Все документы» таблицей (название, папка, статус, ответственный). Вью «По папкам» с
    группировкой по `folder`: если `defineView` не принимает группировку по связи, сделать вью
    «По статусам» с группировкой по `status` и записать расхождение.
  - Пункт меню приложению не нужен: он есть в манифесте фронта.
  - В `packages/twenty-apps/smb/presets.json` ничего не менять.
  - Поля на объекте `task` не добавлять (R15, вопрос №1).
  Готово: `cd packages/twenty-apps/smb/docflow && npx oxlint -c .oxlintrc.json .` без ошибок.
  Установка в компанию — `NOT RUN` (нужен спайк S1 из `TODO.md`).
- [ ] **H-16. Хуки документов.** `hooks/useSmbDocumentFolders.ts` и `hooks/useSmbDocuments.ts`
  (параметр `folderId: string | undefined`) на `useFindManyRecords`, поле `skip`, пока объекта нет в
  метаданных. Хук `hooks/useIsSmbDocflowAppInstalled.ts`: по `useObjectMetadataItems` проверяет, что
  есть объекты с `nameSingular` `smbDocument` и `smbDocumentFolder`.
- [ ] **H-17. Вкладка «Документы»** (после H-16, H-7). Заменить заглушку
  `components/SmbDocflowDocumentsTab.tsx`. Если `useIsSmbDocflowAppInstalled` вернул `false`,
  показать `SmbDocflowEmptyState` с текстом «Установите приложение „Документооборот“» и хуки записей
  не вызывать (вынести содержимое в отдельный компонент). Иначе: слева дерево папок, в середине
  документы выбранной папки, справа предпросмотр через `SmbDocflowSplitLayout`: название, статус,
  автор, дата создания, размер и тип файла, кнопка «Скачать» (`downloadFile` из
  `@/activities/files/utils/downloadFile`). Картинки (`img`) и PDF (`iframe`) показывать внутри
  панели, остальное значком. Утилита `utils/buildSmbDocumentFolderTree.ts` (вход плоский список
  папок с `parentFolderId`, выход дерево) с тестом: вложенность в три уровня, папка с несуществующим
  родителем попадает в корень, цикл A → B → A не вешает функцию и обе папки попадают в корень. В
  комментарии файла ссылку `ADR-010-docflow.md` заменить на `ADR-016-docflow.md`.
- [ ] **H-18. Реестр редакторов** (после H-17). `constants/SmbDocumentEditors.ts`: объект
  `SMB_DOCUMENT_EDITORS` с ключами `NONE | UNIVER_SHEET | UNIVER_DOC`, значение это React-компонент
  с пропсами `{ documentId: string }`. Для всех трёх ключей пока один компонент просмотра файла из
  H-17. Предпросмотр выбирает компонент по `document.editorKind`. Univer не устанавливать и не
  импортировать.
- [ ] **H-19. Создание папки и загрузка файла** (после H-17). Кнопки «Новая папка» (диалог с
  названием и цветом, `useCreateOneRecord`) и «Загрузить». Загрузка: `useUploadFilesFieldFile` из
  `@/object-record/record-field/ui/meta-types/hooks/useUploadFilesFieldFile`, вторым аргументом
  `id` метаданных поля `file` объекта `smbDocument`; результат записать в поле `file` новой записи
  `smbDocument` (папка = выбранная, `author` = текущий участник из `currentWorkspaceMemberState`,
  `name` = имя файла). Путь вложений (`@/activities/files`) не использовать (R15, «Разбор блока C»
  п.4). Проверка в браузере — `NOT RUN` до установки приложения.

## V. Проверки на стенде, которые остались

Не для исполнителя кода: делает владелец или отдельная сессия с браузером.

- [ ] **V-1.** Шаг-форма с исполнителем-переменной (`smbRole: 'ASSIGNEE'`): задание видно
  исполнителю как «моё», запустившему как чужое. Нужен второй пользователь.
- [ ] **V-2.** После H-2…H-8: вкладки «Задания» и «Процессы» в браузере, скриншоты в
  `docs/reports/assets/`.
- [ ] **V-3.** После спайка S1: установка App `docflow` (install → uninstall → install на чистой
  компании), затем H-17 и H-19 в браузере, затем снять `isPlatform` в манифесте.
- [ ] **V-4.** После H-13 и пересборки сервера: `node dist/command/command smb:bitrix:bind-portal`
  на несуществующем `member_id` завершается с кодом 1.

## Ждёт владельца

Вопросы с предложениями — `docs/reports/R15.md`, «Вопросы владельцу»:

1. Поля задачи 2.0: использовать поля приложения `tasks` вместо `smb*`-дублей (бывшая C2).
2. A4: оставить 403 на запрос без refresh-токена.
3. D5: двухшаговое подтверждение привязки (администратор + письмо владельцу аккаунта).
4. B6: делать ли свою панель «обязательное / роль» в редакторе шага-формы.

## Не для этого списка

- Проверка на тестовом портале Б24: cookie во фрейме в Chrome, Safari, Firefox; работа `BX24`
  после серверного обмена токена; установка, удаление, повторная установка (ADR-015 «Не проверено»).
- Серверная проверка обязательных полей (ADR-016 «Последствия»).
- Этап 2 задачи 2.0: запись `task` на каждый шаг с исполнителем и закрытие шага закрытием задачи.
- Чат задачи: нужен вызов «канал записи» от модуля мессенджера.
- Univer.
- Автосоздание workspace по флагу: до ответа юриста о лимите 5 workspace и до wildcard-сертификата.
