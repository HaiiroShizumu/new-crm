import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

export const SMB_FEED_MODULE_MANIFEST = {
  key: 'feed',
  applicationUniversalIdentifier: 'c2d4372a-5a64-472d-b309-f3eb52c76b4a',
  dependsOn: [],
  routes: [
    {
      path: '/feed',
      // именованный экспорт страницы -> контракт React.lazy
      loader: () =>
        import('@/smb-feed/pages/FeedPage').then((module) => ({
          default: module.FeedPage,
        })),
    },
  ],
  navigation: [
    {
      labelKey: 'feed.title',
      icon: 'IconNews',
      to: '/feed',
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
