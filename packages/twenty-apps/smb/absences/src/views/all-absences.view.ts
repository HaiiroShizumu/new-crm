import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
  ABSENCE_TITLE_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
  ABSENCE_MEMBER_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
  ABSENCE_ABSENCETYPE_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
  ABSENCE_STARTDATE_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
  ABSENCE_ENDDATE_UNIVERSAL_IDENTIFIER,
  ALL_ABSENCES_VIEW_FIELD_5_UNIVERSAL_IDENTIFIER,
  ABSENCE_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_ABSENCES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Все отсутствия',
  objectUniversalIdentifier: ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCalendarOff',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_0_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: ABSENCE_TITLE_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_1_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: ABSENCE_MEMBER_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_2_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ABSENCE_ABSENCETYPE_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_3_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: ABSENCE_STARTDATE_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_4_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: ABSENCE_ENDDATE_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: ALL_ABSENCES_VIEW_FIELD_5_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: ABSENCE_STATUS_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 140,
    },
  ],
});
