# График отсутствий (smb-absences)

App модуля **absences** — данные (объекты, поля, вью, роли, workflows), доставляемые
через механизм Apps Twenty. Фронт-часть модуля: `packages/twenty-front/src/modules/smb-absences/`,
серверная (если нужна): `packages/twenty-server/src/modules/smb-absences/`.

- universalIdentifier: `f3c265f4-7c82-4f39-8d71-89d1fdfdcff1`
- Установка: `twenty app apply` (см. `docs/dev/module-authoring.md`)
- Модуль включён в компании тогда и только тогда, когда этот App установлен (ADR-009 п.3)
