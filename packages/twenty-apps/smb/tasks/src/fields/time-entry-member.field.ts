import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  TIME_ENTRY_MEMBER_UNIVERSAL_IDENTIFIER,
  MEMBER_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TIME_ENTRY_MEMBER_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Сотрудник',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    MEMBER_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'memberId',
  },
});
