import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MEMBER_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_MEMBERS_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: MEMBER_DEPARTMENT_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'department',
  label: 'Отдел',
  icon: 'IconSitemap',
  relationTargetObjectMetadataUniversalIdentifier:
    DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DEPARTMENT_MEMBERS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'departmentId',
  },
});
