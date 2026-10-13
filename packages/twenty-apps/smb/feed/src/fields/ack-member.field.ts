import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  ACK_MEMBER_UNIVERSAL_IDENTIFIER,
  MEMBER_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: ACK_MEMBER_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'member',
  label: 'Сотрудник',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    MEMBER_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'memberId',
  },
});
