import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_DOCUMENTS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENTS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENTS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENTS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  ALL_DOCUMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  DOCUMENT_FOLDER_UNIVERSAL_IDENTIFIER,
  DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
  DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_DOCUMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все документы',
  objectUniversalIdentifier: DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFiles',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_DOCUMENTS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: ALL_DOCUMENTS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DOCUMENT_FOLDER_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: ALL_DOCUMENTS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: ALL_DOCUMENTS_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 180,
    },
  ],
});
