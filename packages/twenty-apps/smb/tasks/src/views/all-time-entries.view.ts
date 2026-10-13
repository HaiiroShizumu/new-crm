import { defineView, ViewType } from 'twenty-sdk/define';

import {
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  ALL_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  ALL_TIME_ENTRIES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_STARTEDAT_UNIVERSAL_IDENTIFIER,
  ALL_TIME_ENTRIES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_ENDEDAT_UNIVERSAL_IDENTIFIER,
  ALL_TIME_ENTRIES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_DURATIONMINUTES_UNIVERSAL_IDENTIFIER,
  ALL_TIME_ENTRIES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_TIME_ENTRIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Весь учёт времени',
  objectUniversalIdentifier: TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconClockPlay',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_TIME_ENTRIES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        TIME_ENTRY_STARTEDAT_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: ALL_TIME_ENTRIES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: TIME_ENTRY_ENDEDAT_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: ALL_TIME_ENTRIES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        TIME_ENTRY_DURATIONMINUTES_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: ALL_TIME_ENTRIES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: TIME_ENTRY_TASK_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 220,
    },
  ],
});
