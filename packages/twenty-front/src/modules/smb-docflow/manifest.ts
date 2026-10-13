import { SMB_DOCFLOW_PATH } from '@/smb-docflow/constants/SmbDocflowPath';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

// Документооборот (ADR-016). Задания и процессы работают на штатных процессах
// без приложения, поэтому модуль включён всегда (isPlatform). Приложение
// `packages/twenty-apps/smb/docflow` с тем же applicationUniversalIdentifier
// добавляет документы; когда его установка проверена (TODO L-2), isPlatform
// снимается: по ADR-013 п.3 это дополнительный модуль.
export const SMB_DOCFLOW_MODULE_MANIFEST = {
  key: 'docflow',
  isPlatform: true,
  applicationUniversalIdentifier: '0b7d5d2e-8c4f-4a59-9a43-2f6f1c3e9d21',
  dependsOn: [],
  routes: [
    {
      path: `${SMB_DOCFLOW_PATH}/:tab?`,
      loader: () =>
        import('@/smb-docflow/pages/SmbDocflowPage').then((module) => ({
          default: module.SmbDocflowPage,
        })),
    },
  ],
  navigation: [
    {
      labelKey: 'Документооборот',
      icon: 'IconFiles',
      to: SMB_DOCFLOW_PATH,
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: { path: 'embed/docflow' },
} as const satisfies SmbModuleManifest;
