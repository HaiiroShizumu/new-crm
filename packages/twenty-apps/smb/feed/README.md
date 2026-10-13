# Лента новостей (smb-feed)

App модуля **feed** — данные (объекты, поля, вью, роли, workflows), доставляемые
через механизм Apps Twenty. Фронт-часть модуля: `packages/twenty-front/src/modules/smb-feed/`,
серверная (если нужна): `packages/twenty-server/src/modules/smb-feed/`.

- universalIdentifier: `c2d4372a-5a64-472d-b309-f3eb52c76b4a`
- Установка: `twenty app apply` (см. `docs/dev/module-authoring.md`)
- Модуль включён в компании тогда и только тогда, когда этот App установлен (ADR-009 п.3)
