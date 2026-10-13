import { FieldType, RelationType, defineField } from 'twenty-sdk/define';

import {
  DOCUMENT_FOLDER_CHILD_FOLDERS_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: DOCUMENT_FOLDER_CHILD_FOLDERS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'childFolders',
  label: 'Вложенные папки',
  icon: 'IconFolders',
  relationTargetObjectMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
