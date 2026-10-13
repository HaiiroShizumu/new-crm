import {
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  TASK_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.RELATION,
  name: 'timeEntries',
  label: 'Учёт времени',
  icon: 'IconClockPlay',
  relationTargetObjectMetadataUniversalIdentifier:
    TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
