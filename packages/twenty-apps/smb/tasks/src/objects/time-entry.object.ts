import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_NOTE_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_STARTEDAT_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_ENDEDAT_UNIVERSAL_IDENTIFIER,
  TIME_ENTRY_DURATIONMINUTES_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineObject({
  universalIdentifier: TIME_ENTRY_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'timeEntry',
  namePlural: 'timeEntries',
  labelSingular: 'Учёт времени',
  labelPlural: 'Учёт времени',
  description: 'Запись времени по задаче',
  icon: 'IconClockPlay',
  labelIdentifierFieldMetadataUniversalIdentifier:
    TIME_ENTRY_NOTE_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: TIME_ENTRY_NOTE_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      label: 'Комментарий',
      icon: 'IconAbc',
      name: 'note',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: TIME_ENTRY_STARTEDAT_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      label: 'Начало',
      icon: 'IconCalendar',
      name: 'startedAt',
    },
    {
      universalIdentifier: TIME_ENTRY_ENDEDAT_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      label: 'Конец',
      icon: 'IconCalendar',
      name: 'endedAt',
      isNullable: true,
      defaultValue: null,
    },
    {
      universalIdentifier: TIME_ENTRY_DURATIONMINUTES_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      label: 'Минут',
      icon: 'IconClock',
      name: 'durationMinutes',
      isNullable: true,
      defaultValue: null,
    },
  ],
});
