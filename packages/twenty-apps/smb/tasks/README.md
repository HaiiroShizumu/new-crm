# Задачи 2.0 (smb-tasks)

App модуля **tasks** — данные (объекты, поля, вью, роли, workflows), доставляемые
через механизм Apps Twenty. Фронт-часть модуля: `packages/twenty-front/src/modules/smb-tasks/`,
серверная (если нужна): `packages/twenty-server/src/modules/smb-tasks/`.

- universalIdentifier: `c8c07cc1-818f-40c3-937d-82525b9e80c9`
- Установка: `twenty app apply` (см. `docs/dev/module-authoring.md`)
- Модуль включён в компании тогда и только тогда, когда этот App установлен (ADR-009 п.3)
