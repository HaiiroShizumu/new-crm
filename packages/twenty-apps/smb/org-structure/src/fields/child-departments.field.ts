import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CHILD_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: CHILD_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'childDepartments',
  label: 'Дочерние отделы',
  icon: 'IconSitemap',
  relationTargetObjectMetadataUniversalIdentifier:
    DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
