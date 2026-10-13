import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

export const SMB_ABSENCES_MODULE_MANIFEST = {
  key: 'absences',
  applicationUniversalIdentifier: 'f3c265f4-7c82-4f39-8d71-89d1fdfdcff1',
  dependsOn: ['org-structure'],
  routes: [
    {
      path: '/absences',
      // именованный экспорт страницы -> контракт React.lazy
      loader: () =>
        import('@/smb-absences/pages/AbsencesPage').then((module) => ({
          default: module.AbsencesPage,
        })),
    },
  ],
  navigation: [
    {
      labelKey: 'absences.title',
      icon: 'IconCalendarOff',
      to: '/absences',
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
