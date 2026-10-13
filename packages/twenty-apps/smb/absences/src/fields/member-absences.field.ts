import {
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  MEMBER_ABSENCES_UNIVERSAL_IDENTIFIER,
  ABSENCE_MEMBER_UNIVERSAL_IDENTIFIER,
  ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: MEMBER_ABSENCES_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'absences',
  label: 'Отсутствия',
  icon: 'IconCalendarOff',
  relationTargetObjectMetadataUniversalIdentifier:
    ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ABSENCE_MEMBER_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
