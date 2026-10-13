# TODO: документооборот и канал Б24 (очередь для Hermes)

> Перенесено 2026-10-13 из клона `twenty-rebuild` (отчёт `docs/reports/R13.md`). Номера ADR, реестра и
> отчётов и пути каталогов приведены к этому дереву; содержание решений не менялось.

Источник: `docs/reports/R12.md`, решения в `docs/adr/ADR-015-bitrix-channel.md` и
`docs/adr/ADR-016-docflow.md`. Сначала прочитать оба ADR. Архитектуру не менять: если задача
упирается в решение из ADR, остановиться и записать вопрос в отчёт.

Правила те же, что в `TODO.md` (раздел «Правила для каждой задачи»). Дополнительно:

- одна задача = один коммит = один отчёт `docs/reports/R<NN>.md`;
- перед правкой открыть 2–3 соседних файла того же каталога и писать так же (имена, импорты,
  стили через `styled` из `@linaria/react`, тексты через `useLingui`);
- готовые образцы в этом же модуле: компонент `SmbDocflowTasksTab.tsx`, хук `useSmbDocflowTasks.ts`,
  утилита с тестом `getSmbMissingRequiredFields.ts`;
- кнопки и иконки: `Button` из `twenty-ui/primitives/input` (`variant="solid" | "outline"`,
  `size="sm"`, иконка через `startIcon={<IconX />}`), `LightIconButton` из `twenty-ui/components`
  (иконка в `children`, обязателен `aria-label`), иконки только из `twenty-ui/icon`;
- в одном файле одна экспортируемая константа (правило линтера `max-consts-per-file`);
- переходы по страницам через `<Link>`, не через `navigate()`;
- файлы ядра не трогать. Если без правки ядра никак, остановиться и написать вопрос.

Проверка после каждой задачи фронта (команды запускать в контейнере hermes):

```bash
cd packages/twenty-front
npx oxlint -c .oxlintrc.json src/modules/smb-docflow src/modules/smb-embed
npx oxfmt --check src/modules/smb-docflow src/modules/smb-embed
cd ../.. && npx jest packages/twenty-front/src/modules/smb-docflow --config=packages/twenty-front/jest.config.mjs --maxWorkers=1 --coverage=false
```

Проверка после задачи сервера:

```bash
cd packages/twenty-server && npx oxlint -c .oxlintrc.json src/modules/smb-bitrix
cd ../.. && npx jest packages/twenty-server/src/modules/smb-bitrix --config=packages/twenty-server/jest.config.mjs --maxWorkers=1
```

## A. Сначала: проверить то, что не запускалось

- [x] **A1.** *(R13: строки `AppPath.Docflow` больше нет, путь задан в модуле; `tsgo` по фронту без ошибок в `smb-docflow` и `smb-embed`)* **Пересобрать `twenty-shared`** (на VM или при swap < 80%):
  `nice -n 19 npx nx build twenty-shared --skip-nx-cache`. Затем
  `cd packages/twenty-front && npx tsgo -p tsconfig.json --noEmit`.
  Готово: ошибок `Property 'Docflow' does not exist on type 'typeof AppPath'` нет. Любые другие
  ошибки в `smb-docflow`, `smb-embed`, `pages/smb-docflow` исправить, остальные только перечислить.
- [x] **A2.** *(R13: `tsgo` по серверу — 0 ошибок)* **Типы сервера целиком:** `cd packages/twenty-server && npx tsgo -p tsconfig.json --noEmit`.
  Готово: нет ошибок в `smb-bitrix`, `smb-config`, `smb-server`.
- [x] **A3.** *(R13: сервер стартует, `SmbBitrixModule` поднят, миграция `bitrix/0001…` применена; таблицы теперь `smb.bitrixPortal` и `smb.bitrixUser`, проверка генератором неприменима)* **Запустить сервер и миграцию** на чистой БД (`npx nx database:reset twenty-server`,
  затем старт). Готово: сервер стартует без ошибок DI с упоминанием `SmbBitrix`, в БД есть таблицы
  `core."smbBitrixPortal"` и `core."smbBitrixUser"`. Затем
  `npx nx run twenty-server:database:migrate:generate --name check-smb-bitrix --type fast`:
  генератор не должен создать ни одного запроса для этих двух таблиц. Если создал, приложить его
  вывод в отчёт и удалить сгенерированный файл, миграцию руками не править.
- [ ] **A4. Проверить адреса без портала:**
  `curl -si -X POST localhost:3000/webhooks/smb-bitrix/app -d 'member_id=x'`.
  Готово: статус 503 и HTML-страница, если `SMB_BITRIX_*` не заданы; 403 и страница «This page must
  be opened from Bitrix24», если заданы. В обоих случаях в ответе нет заголовка `Location`.
- [x] **A5.** *(R13: вкладки переключаются, список процессов и заданий читается; скриншот `docs/reports/assets/docflow.png`)* **Открыть `/docflow` в браузере** под обычным пользователем. Готово: три вкладки
  переключаются, адрес меняется на `/docflow/processes` и `/docflow/documents`, кнопок «Fullscreen»
  и «Open CRM» нет (они только во фрейме). Скриншот в `docs/reports/assets/`.
- [ ] **A6. Сценарий процесса.** В редакторе workflow создать процесс: ручной триггер → форма
  (поле «Причина», текст) → Create Record (заметка с причиной). Опубликовать. Во вкладке
  «Процессы» выбрать его, ввести причину, нажать Start. Готово: заметка создана с введённым
  текстом. Записать, сколько секунд прошло от нажатия до сообщения «Process started».

## B. Интерфейс заданий и процессов

- [ ] **B1. Пункт меню.** Добавить «Документооборот» в боковую навигацию CRM штатным способом:
  navigation menu item типа ссылка на `/docflow` (через интерфейс «Edit navigation», без кода).
  Записать в отчёт, как это повторить для нового workspace. Иконка по
  `packages/twenty-ui/src/icon/icon-dictionary.md`.
- [ ] **B2. Карточки «требуют внимания».** В `SmbDocflowTasksTab.tsx` раздел «Waiting for you»
  показать не строками, а карточками в ряд с горизонтальной прокруткой. Новый компонент
  `components/SmbDocflowTaskCard.tsx`: название задания, название процесса, срок
  (`task.dueAt`, формат через `formatDate` из соседних модулей), красная метка «Overdue» по
  `isSmbDocflowTaskOverdue`. Клик выбирает задание так же, как строка. Раздел «Other tasks»
  оставить строками.
- [ ] **B3. Таблица всех заданий.** Раздел «Other tasks» сделать таблицей с колонками: задание,
  процесс, исполнитель, срок, создано. Имя исполнителя брать из списка участников: хук
  `useFindManyRecords({ objectNameSingular: CoreObjectNameSingular.WorkspaceMember })`, сопоставить
  по `task.assigneeWorkspaceMemberId`. Сортировка по сроку (без срока в конце). Сортировку вынести
  в утилиту `utils/sortSmbDocflowTasks.ts` с тестом.
- [ ] **B4. Панель предпросмотра в стиле проекта.** `SmbDocflowSplitLayout.tsx`: панель справа
  должна выезжать с анимацией и иметь кнопку закрытия. Взять значения длительности и easing из
  штатной боковой панели (`packages/twenty-front/src/modules/side-panel/`, найти там `motion` или
  `transition`) и применить те же. Сам компонент штатной панели не переиспользовать и не править.
  На ширине меньше 900px панель занимает весь экран поверх списка.
- [ ] **B5. Шаги процесса в предпросмотре задания.** Под формой в `SmbDocflowTaskPreview.tsx`
  показать список шагов запуска со статусами. Утилита `utils/getSmbDocflowRunTimeline.ts`
  (вход: `workflowRun.state`, выход: массив `{ stepId, name, status }` в порядке `flow.steps`)
  с тестом по образцу `getSmbDocflowTasksFromRun.test.ts`. Запуск получать хуком `useWorkflowRun`.
- [ ] **B6. Обязательность и роль поля в редакторе процесса.** Сначала проверка (пункт 3 в
  «Что проверить на стенде» ADR-016): открыть шаг-форму в редакторе, вручную через GraphQL
  записать полю `settings.smbIsRequired = true`, затем переименовать поле в редакторе и
  посмотреть, сохранился ли ключ. Результат в отчёт. Код не писать: по результату решает владелец.
- [ ] **B7. Кнопки «Создать» и «Изменить» на вкладке «Процессы».** «Создать» это ссылка на
  штатный список workflow (`/objects/workflows`), «Изменить» у выбранного процесса это ссылка на
  `getAppPath(AppPath.RecordShowPage, { objectNameSingular: 'workflow', objectRecordId: process.workflowId })`.
  Во встроенном режиме (`isSmbEmbedded()`) обе кнопки не показывать: редактор открывается в CRM.
- [ ] **B8. Состояние загрузки.** Во вкладках «Задания» и «Процессы» пока `loading === true`
  показывать скелет из 5 серых строк вместо пустого экрана. Компонент
  `components/SmbDocflowListSkeleton.tsx`.
- [ ] **B9. Тесты компонентов.** `SmbDocflowForm`: (1) при пустом обязательном поле `onSubmit`
  возвращает его, и на экране появляется текст «Fill in: …» с подписью поля; (2) у обязательного
  поля в подписи есть звёздочка; (3) служебное поле с `smbRole` не отображается. Образец
  окружения теста взять из `packages/twenty-front/src/modules/workflow/**/__tests__/*.test.tsx`.

## C. Документы

- [ ] **C1. Приложение `apps/smb-docflow`.** По образцу `packages/twenty-apps/examples/hello-world`.
  Справка по составу (только читать, код не копировать, он под v2.42.6):
  `../new-crm-master/packages/twenty-apps/internal/doc-management/src/`.
  Объекты:
  - `smbDocumentFolder`: `name` (TEXT), `color` (SELECT: gray, blue, green, orange, red, purple),
    `parentFolder` (связь many-to-one на `smbDocumentFolder`, необязательная);
  - `smbDocument`: `name` (TEXT), `folder` (many-to-one на `smbDocumentFolder`, необязательная),
    `file` (FILES, один файл), `status` (SELECT: DRAFT, IN_REVIEW, APPROVED, ARCHIVED),
    `author` и `responsible` (many-to-one на workspaceMember), `editorKind` (SELECT: NONE,
    UNIVER_SHEET, UNIVER_DOC, по умолчанию NONE), `editorSnapshot` (RAW_JSON).
  Вью: «Все документы» таблицей, «По папкам» с группировкой по `folder`.
  Готово: install → uninstall → install на чистом workspace без ошибок, вывод в отчёт.
- [ ] **C2. Поля задачи 2.0** в том же приложении, на стандартном объекте `task`:
  `smbFormSchema` (RAW_JSON), `smbFormValues` (RAW_JSON), `smbWorkflowRunId` (TEXT),
  `smbWorkflowStepId` (TEXT). Только поля, логики нет. Готово: поля видны в Settings → Data model.
- [ ] **C3. Хуки документов.** `hooks/useSmbDocumentFolders.ts` и `hooks/useSmbDocuments.ts`
  (параметр `folderId: string | undefined`) на `useFindManyRecords`. Если объекта нет в метаданных
  (приложение не установлено), вкладка показывает текст «Install the Document flow application»,
  а не падает: проверять наличие через `useObjectMetadataItems` до вызова хуков записей.
- [ ] **C4. Вкладка «Документы».** Заменить заглушку `SmbDocflowDocumentsTab.tsx`: слева дерево
  папок (вложенность по `parentFolder`, утилита `utils/buildSmbDocumentFolderTree.ts` с тестом,
  включая случай цикла в данных: цикл не должен вешать страницу), в середине список документов
  выбранной папки, справа предпросмотр через `SmbDocflowSplitLayout`. Предпросмотр: название,
  статус, автор, дата, размер и тип файла, кнопка «Скачать». Картинки и PDF показывать внутри
  панели, остальное значком типа.
- [ ] **C5. Реестр редакторов (лазейка под Univer).** `constants/SmbDocumentEditors.ts`: объект
  `SMB_DOCUMENT_EDITORS` с ключами `NONE | UNIVER_SHEET | UNIVER_DOC`, значение это React-компонент
  с пропсами `{ documentId: string }`. Для `NONE` компонент просмотра файла из C4, для двух
  остальных пока тот же компонент. Предпросмотр выбирает компонент по `document.editorKind`.
  Univer не устанавливать и не импортировать.
- [ ] **C6. Создание папки и загрузка файла.** Кнопки «Новая папка» (диалог с названием и цветом)
  и «Загрузить» (создаёт `smbDocument` в выбранной папке, автор = текущий участник). Загрузку
  файла сделать тем же способом, каким штатно загружаются вложения
  (`packages/twenty-front/src/modules/activities/files/`).

## D. Канал Б24 (мелкое)

- [ ] **D1. Переменные в compose.** В `smb/deploy/docker-compose.yml` в общий блок окружения
  server/worker добавить `SMB_BITRIX_CLIENT_ID`, `SMB_BITRIX_CLIENT_SECRET`,
  `SMB_BITRIX_AUTO_PROVISION_WORKSPACE` по образцу соседних `STORAGE_S3_*`. Готово:
  `docker compose -f smb/deploy/docker-compose.yml --env-file smb/deploy/.env.example config` рендерится.
- [ ] **D2. Документ для оператора** `docs/ops/bitrix-app.md`: что вписать в карточку приложения
  в кабинете вендора Б24. Адрес приложения `https://<корень>/webhooks/smb-bitrix/app`, адрес
  установки `…/install`, обработчик событий `…/event` для `ONAPPINSTALL` и `ONAPPUNINSTALL`,
  права `user`. Плюс где взять `client_id` и `client_secret`.
- [ ] **D3. Тест `SmbBitrixPortalService.isApplicationTokenValid`** (файл
  `services/__tests__/smb-bitrix-portal.service.spec.ts`, зависимости заглушками по образцу
  `smb-bitrix-launch.service.spec.ts`): верный токен, неверный, пустой, портал без сохранённого
  токена, ошибка расшифровки.
- [ ] **D4. Команда привязки портала.** CLI-команда `smb:bitrix:bind-portal --member-id <id>
  --workspace-id <uuid>` в `smb-bitrix/commands/`, вызывает `SmbBitrixPortalService.bindToWorkspace`.
  Образец оформления команд: любая `*.command.ts` в `packages/twenty-server/src/engine/core-modules/`.
  Если регистрация команды требует правки файла ядра, остановиться и написать вопрос.
- [ ] **D5. Список непривязанных сотрудников.** Только проект в отчёте, без кода: что должен
  видеть администратор workspace, когда сотрудник получил «An account with your email already
  exists», и как он подтверждает привязку. Учесть правило из ADR-015 п.4.
- [ ] **D6. Переводы.** Собрать список всех строк из `smb-bitrix`, `smb-embed`, `smb-docflow`
  (всё, что в `msg\`…\`` и `t\`…\``) с русским переводом в `docs/reports/R<NN>-strings.md`.
  Каталоги `locales/*.po` не коммитить.

## E. Не для этого списка (делает владелец или отдельная задача)

- Проверка на тестовом портале Б24: cookie во фрейме в Chrome, Safari, Firefox; работа `BX24`
  после серверного обмена токена; установка, удаление, повторная установка (ADR-015 «Не проверено»).
- Серверная проверка обязательных полей (ADR-016 «Последствия»).
- Этап 2 задачи 2.0: запись `task` на каждый шаг с исполнителем и закрытие шага закрытием задачи.
- Чат задачи: нужен вызов «канал записи» от модуля мессенджера.
- Univer.
- Автосоздание workspace по флагу: до ответа юриста о лимите 5 workspace и до wildcard-сертификата.
