import {
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import { TASK_OUTCOME_UNIVERSAL_IDENTIFIER } from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_OUTCOME_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'outcome',
  label: 'Исход',
  icon: 'IconFlag',
  isNullable: true,
  defaultValue: null,
});
