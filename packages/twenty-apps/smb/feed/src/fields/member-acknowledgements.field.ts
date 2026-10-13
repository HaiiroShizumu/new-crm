import {
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  MEMBER_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  ACK_MEMBER_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: MEMBER_ACKNOWLEDGEMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'feedAcknowledgements',
  label: 'Ознакомления с постами',
  icon: 'IconChecks',
  relationTargetObjectMetadataUniversalIdentifier:
    FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ACK_MEMBER_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
