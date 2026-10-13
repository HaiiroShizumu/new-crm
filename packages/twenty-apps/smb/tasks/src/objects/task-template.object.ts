import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_NAME_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_DESCRIPTION_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_RESULTFORM_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_ESTIMATEMINUTES_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineObject({
  universalIdentifier: TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'taskTemplate',
  namePlural: 'taskTemplates',
  labelSingular: 'Шаблон задачи',
  labelPlural: 'Шаблоны задач',
  description: 'Шаблон задачи с формой результата',
  icon: 'IconTemplate',
  labelIdentifierFieldMetadataUniversalIdentifier:
    TASK_TEMPLATE_NAME_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: TASK_TEMPLATE_NAME_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Название',
      icon: 'IconAbc',
      name: 'name',
    },
    {
      universalIdentifier: TASK_TEMPLATE_DESCRIPTION_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Описание',
      icon: 'IconAlignLeft',
      name: 'description',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: TASK_TEMPLATE_RESULTFORM_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      label: 'Форма результата',
      icon: 'IconForms',
      name: 'resultForm',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: TASK_TEMPLATE_ESTIMATEMINUTES_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      label: 'Оценка, мин',
      icon: 'IconClock',
      name: 'estimateMinutes',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
