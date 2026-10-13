import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
  MEMBER_RESPONSIBLE_DOCUMENTS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'responsible',
  label: 'Ответственный',
  icon: 'IconUserCheck',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    MEMBER_RESPONSIBLE_DOCUMENTS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'responsibleId',
  },
});
