import { defineRole } from 'twenty-sdk/define';

export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER =
  '26b1dde8-4ed9-4f39-8516-e0dcb734ea5a';

export default defineRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'docflow default role',
  description: 'docflow default role',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
});
