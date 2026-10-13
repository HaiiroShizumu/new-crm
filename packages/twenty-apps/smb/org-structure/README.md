# Структура компании (smb-org-structure)

App модуля **org-structure** — данные (объекты, поля, вью, роли, workflows), доставляемые
через механизм Apps Twenty. Фронт-часть модуля: `packages/twenty-front/src/modules/smb-org-structure/`,
серверная (если нужна): `packages/twenty-server/src/modules/smb-org-structure/`.

- universalIdentifier: `ea5e9dfa-bc11-4df8-86e3-e705f6b2a554`
- Установка: `twenty app apply` (см. `docs/dev/module-authoring.md`)
- Модуль включён в компании тогда и только тогда, когда этот App установлен (ADR-009 п.3)
