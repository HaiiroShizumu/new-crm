import { defineView, ViewType } from 'twenty-sdk/define';

import {
  DOCUMENTS_BY_STATUS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  DOCUMENTS_BY_STATUS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  DOCUMENTS_BY_STATUS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  DOCUMENTS_BY_STATUS_VIEW_UNIVERSAL_IDENTIFIER,
  DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
  DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
  DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: DOCUMENTS_BY_STATUS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'По статусам',
  objectUniversalIdentifier: DOCUMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier:
    DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
  groups: [
    {
      universalIdentifier: 'cf26d853-f45c-43dc-860e-14153353b8dd',
      fieldValue: 'DRAFT',
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: '8415c68b-d508-4c82-ae57-a898bb5c8c3c',
      fieldValue: 'IN_REVIEW',
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: 'e339b81c-e1ff-4062-b5e8-e66150e32111',
      fieldValue: 'APPROVED',
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: 'b7fe13e8-85b0-4fea-bd84-e9c5a5112aa5',
      fieldValue: 'ARCHIVED',
      position: 3,
      isVisible: true,
    },
  ],
  fields: [
    {
      universalIdentifier:
        DOCUMENTS_BY_STATUS_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DOCUMENT_NAME_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier:
        DOCUMENTS_BY_STATUS_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: DOCUMENT_STATUS_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier:
        DOCUMENTS_BY_STATUS_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        DOCUMENT_RESPONSIBLE_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 180,
    },
  ],
});
