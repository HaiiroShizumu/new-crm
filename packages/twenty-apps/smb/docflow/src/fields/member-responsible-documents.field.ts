import {
  FieldType,
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
  universalIdentifier: MEMBER_RESPONSIBLE_DOCUMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'smbResponsibleDocuments',
  label: 'Документы (ответственный)',
  icon: 'IconFiles',
  relationTargetObjectMetadataUniversalIdentifier:
    DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
