import {
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  DOCUMENT_AUTHOR_UNIVERSAL_IDENTIFIER,
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  MEMBER_AUTHORED_DOCUMENTS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: MEMBER_AUTHORED_DOCUMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'smbAuthoredDocuments',
  label: 'Документы (автор)',
  icon: 'IconFiles',
  relationTargetObjectMetadataUniversalIdentifier:
    DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DOCUMENT_AUTHOR_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
