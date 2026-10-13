import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  DOCUMENT_FOLDER_DOCUMENTS_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_UNIVERSAL_IDENTIFIER,
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: DOCUMENT_FOLDER_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'folder',
  label: 'Папка',
  icon: 'IconFolder',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_DOCUMENTS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'folderId',
  },
});
