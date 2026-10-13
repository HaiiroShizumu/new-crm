import {
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import {
  TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
  TASK_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'task',
  label: 'Задача',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    TASK_TIME_ENTRIES_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'taskId',
  },
});
