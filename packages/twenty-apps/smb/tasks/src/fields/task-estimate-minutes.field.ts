import {
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import { TASK_ESTIMATE_MINUTES_UNIVERSAL_IDENTIFIER } from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_ESTIMATE_MINUTES_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'estimateMinutes',
  label: 'Оценка, мин',
  icon: 'IconClock',
  isNullable: true,
  defaultValue: null,
});
