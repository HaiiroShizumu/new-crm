import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  HEADED_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_HEAD_UNIVERSAL_IDENTIFIER,
  DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineField({
  universalIdentifier: HEADED_DEPARTMENTS_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'headedDepartments',
  label: 'Руководит отделами',
  icon: 'IconSitemap',
  relationTargetObjectMetadataUniversalIdentifier:
    DEPARTMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DEPARTMENT_HEAD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
