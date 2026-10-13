import {
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  defineField,
} from 'twenty-sdk/define';

import { TASK_RESULT_FORM_UNIVERSAL_IDENTIFIER } from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_RESULT_FORM_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.RAW_JSON,
  name: 'resultForm',
  label: 'Форма результата',
  icon: 'IconForms',
  isNullable: true,
  defaultValue: null,
});
