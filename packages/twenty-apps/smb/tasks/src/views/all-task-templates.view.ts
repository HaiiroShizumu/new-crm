import { defineView, ViewType } from 'twenty-sdk/define';

import {
  TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
  ALL_TASK_TEMPLATES_VIEW_UNIVERSAL_IDENTIFIER,
  ALL_TASK_TEMPLATES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_NAME_UNIVERSAL_IDENTIFIER,
  ALL_TASK_TEMPLATES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  TASK_TEMPLATE_ESTIMATEMINUTES_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_TASK_TEMPLATES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все шаблоны',
  objectUniversalIdentifier: TASK_TEMPLATE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconTemplate',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_TASK_TEMPLATES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: TASK_TEMPLATE_NAME_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 260,
    },
    {
      universalIdentifier: ALL_TASK_TEMPLATES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        TASK_TEMPLATE_ESTIMATEMINUTES_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
  ],
});
