import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { SMB_CONVERSATIONS_PATH } from '@/smb-conversations/constants/SmbConversationsPath';

// Платформенный модуль (ADR-010): мессенджер есть в каждой компании, App у
// него нет. Вход — режим «Чаты» в переключателе оболочки, а не пункт меню,
// поэтому navigation пуст.
export const SMB_CONVERSATIONS_MODULE_MANIFEST = {
  key: 'conversations',
  isPlatform: true,
  applicationUniversalIdentifier: '6f0c1c4e-3b0d-4d0c-9d0a-5a6c1f2e7b10',
  dependsOn: [],
  routes: [
    {
      path: `${SMB_CONVERSATIONS_PATH}/:conversationId?`,
      loader: () =>
        import('@/smb-conversations/pages/SmbConversationsPage').then(
          (module) => ({ default: module.SmbConversationsPage }),
        ),
    },
  ],
  navigation: [],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
