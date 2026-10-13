import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

export const SMB_TASKS_MODULE_MANIFEST = {
  key: 'tasks',
  applicationUniversalIdentifier: 'c8c07cc1-818f-40c3-937d-82525b9e80c9',
  dependsOn: [],
  routes: [
    {
      path: '/tasks',
      // именованный экспорт страницы -> контракт React.lazy
      loader: () =>
        import('@/smb-tasks/pages/TasksPage').then((module) => ({
          default: module.TasksPage,
        })),
    },
  ],
  navigation: [
    {
      labelKey: 'tasks.title',
      icon: 'IconChecklist',
      to: '/tasks',
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
