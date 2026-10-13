import { defineView, ViewType } from 'twenty-sdk/define';

import {
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  DEPARTMENTS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  DEPARTMENTS_VIEW_FIELD_PARENT_UNIVERSAL_IDENTIFIER,
  DEPARTMENTS_VIEW_FIELD_HEAD_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_NAME_UNIVERSAL_IDENTIFIER,
  PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_HEAD_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: DEPARTMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все отделы',
  objectUniversalIdentifier: DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconSitemap',
  position: 0,
  fields: [
    {
      universalIdentifier: DEPARTMENTS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DEPARTMENT_NAME_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: DEPARTMENTS_VIEW_FIELD_PARENT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: DEPARTMENTS_VIEW_FIELD_HEAD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DEPARTMENT_HEAD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 240,
    },
  ],
});
