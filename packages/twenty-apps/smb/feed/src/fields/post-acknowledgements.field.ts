import {
  FieldType,
  RelationType,
  defineField,
} from 'twenty-sdk/define';

import {
  POST_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  ACK_POST_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: POST_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FEED_POST_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'acknowledgements',
  label: 'Ознакомления',
  icon: 'IconChecks',
  relationTargetObjectMetadataUniversalIdentifier:
    FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: ACK_POST_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
