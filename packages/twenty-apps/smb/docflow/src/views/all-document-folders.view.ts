import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_DOCUMENT_FOLDERS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENT_FOLDERS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENT_FOLDERS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENT_FOLDERS_VIEW_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_COLOR_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_NAME_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_DOCUMENT_FOLDERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все папки',
  objectUniversalIdentifier: DOCUMENT_FOLDER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFolder',
  position: 0,
  fields: [
    {
      universalIdentifier:
        ALL_DOCUMENT_FOLDERS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        DOCUMENT_FOLDER_NAME_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier:
        ALL_DOCUMENT_FOLDERS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        DOCUMENT_FOLDER_COLOR_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        ALL_DOCUMENT_FOLDERS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        DOCUMENT_FOLDER_PARENT_FOLDER_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 200,
    },
  ],
});
