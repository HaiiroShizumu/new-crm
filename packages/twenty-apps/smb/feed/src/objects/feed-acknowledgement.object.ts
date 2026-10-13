import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_LABEL_UNIVERSAL_IDENTIFIER,
  FEED_ACKNOWLEDGEMENT_ACKNOWLEDGEDAT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineObject({
  universalIdentifier: FEED_ACKNOWLEDGEMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'feedAcknowledgement',
  namePlural: 'feedAcknowledgements',
  labelSingular: 'Ознакомление',
  labelPlural: 'Ознакомления',
  description: 'Отметка «ознакомлен» с важным постом',
  icon: 'IconChecks',
  labelIdentifierFieldMetadataUniversalIdentifier:
    FEED_ACKNOWLEDGEMENT_LABEL_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FEED_ACKNOWLEDGEMENT_LABEL_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconAbc',
      name: 'label',
    },
    {
      universalIdentifier:
        FEED_ACKNOWLEDGEMENT_ACKNOWLEDGEDAT_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      label: 'Ознакомлен',
      icon: 'IconCalendar',
      name: 'acknowledgedAt',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
