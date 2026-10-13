import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  CHILD_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: PARENT_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'parentDepartment',
  label: 'Родительский отдел',
  icon: 'IconSitemap',
  relationTargetObjectMetadataUniversalIdentifier:
    DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CHILD_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'parentDepartmentId',
  },
});
