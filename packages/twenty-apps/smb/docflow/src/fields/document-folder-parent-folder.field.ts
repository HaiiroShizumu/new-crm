import {
  FieldType,
  OnDeleteAction,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  DOCUMENT_FOLDER_CHILD_FOLDERS_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'parentFolder',
  label: 'Родительская папка',
  icon: 'IconFolderUp',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_CHILD_FOLDERS_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'parentFolderId',
  },
});
