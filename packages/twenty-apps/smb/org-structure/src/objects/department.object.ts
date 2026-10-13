import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_NAME_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

// Отдел. Родитель, руководитель и сотрудники — отдельными полями-связями в
// каталоге fields/ (у связей есть обратная сторона, у объекта — нет).
export default defineObject({
  universalIdentifier: DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'department',
  namePlural: 'departments',
  labelSingular: 'Отдел',
  labelPlural: 'Отделы',
  description: 'Отдел компании; отделы образуют дерево',
  icon: 'IconSitemap',
  labelIdentifierFieldMetadataUniversalIdentifier:
    DEPARTMENT_NAME_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: DEPARTMENT_NAME_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconAbc',
      name: 'name',
    },
  ],
});
