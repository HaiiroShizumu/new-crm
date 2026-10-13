import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

export const SMB_ORG_STRUCTURE_MODULE_MANIFEST = {
  key: 'org-structure',
  applicationUniversalIdentifier: 'ea5e9dfa-bc11-4df8-86e3-e705f6b2a554',
  dependsOn: [],
  routes: [
    {
      path: '/org-structure',
      // именованный экспорт страницы -> контракт React.lazy
      loader: () =>
        import('@/smb-org-structure/pages/OrgStructurePage').then((module) => ({
          default: module.OrgStructurePage,
        })),
    },
  ],
  navigation: [
    {
      labelKey: 'org-structure.title',
      icon: 'IconSitemap',
      to: '/org-structure',
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
