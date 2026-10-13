import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MEMBER_JOB_TITLE_UNIVERSAL_IDENTIFIER } from 'src/universal-identifiers';

// Поле на штатном участнике (S1a, ADR-009 №2). Имя `position` занято
// системным полем записи, поэтому — jobTitle.
export default defineField({
  universalIdentifier: MEMBER_JOB_TITLE_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.TEXT,
  name: 'jobTitle',
  label: 'Должность',
  icon: 'IconBriefcase',
  isNullable: true,
  defaultValue: null,
});
