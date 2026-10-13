import { defineApplication } from 'twenty-sdk/define';
import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/roles/default-role';

// Тот же идентификатор стоит в манифесте фронта (smb-docflow/manifest.ts).
export const APPLICATION_UNIVERSAL_IDENTIFIER =
  '0b7d5d2e-8c4f-4a59-9a43-2f6f1c3e9d21';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Документооборот',
  description: 'Папки и документы компании',
  defaultRoleUniversalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
});
