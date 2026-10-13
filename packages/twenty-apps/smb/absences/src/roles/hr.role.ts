import { defineRole } from 'twenty-sdk/define';

import {
  HR_ROLE_UNIVERSAL_IDENTIFIER,
  ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/universal-identifiers';

export default defineRole({
  universalIdentifier: HR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Кадры',
  description: 'Ведёт график отсутствий вручную (A-4)',
  canBeAssignedToUsers: true,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: ABSENCE_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: true,
      canDestroyObjectRecords: false,
    },
  ],
});
