import {
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import { TASK_WORKFLOW_STEP_ID_UNIVERSAL_IDENTIFIER } from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_WORKFLOW_STEP_ID_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.TEXT,
  name: 'workflowStepId',
  label: 'Шаг процесса',
  icon: 'IconRoute',
  isNullable: true,
  defaultValue: null,
});
