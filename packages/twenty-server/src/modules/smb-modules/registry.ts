import { type SmbServerModuleManifest } from 'src/modules/smb-modules/types/smb-server-module-manifest.type';

// Реестр модулей форка на сервере (ADR-009 п.4): одна строка на модуль, как
// smb-modules/registry.ts на фронте. Генератор `yarn smb:module new <key>`
// вставляет строку по маркеру ниже — маркер ровно один, на своём месте.
export const SMB_SERVER_MODULE_MANIFESTS: SmbServerModuleManifest[] = [
  // smb:module:manifests
  {
    key: 'tasks',
    applicationUniversalIdentifier: 'c8c07cc1-818f-40c3-937d-82525b9e80c9',
    expectedVersion: '0.1.0',
  },
  {
    key: 'feed',
    applicationUniversalIdentifier: 'c2d4372a-5a64-472d-b309-f3eb52c76b4a',
    expectedVersion: '0.1.0',
  },
  {
    key: 'absences',
    applicationUniversalIdentifier: 'f3c265f4-7c82-4f39-8d71-89d1fdfdcff1',
    expectedVersion: '0.1.0',
  },
  {
    key: 'org-structure',
    applicationUniversalIdentifier: 'ea5e9dfa-bc11-4df8-86e3-e705f6b2a554',
    expectedVersion: '0.1.0',
  },
];

export const getSmbServerModuleManifestByKey = (
  moduleKey: string,
): SmbServerModuleManifest | undefined =>
  SMB_SERVER_MODULE_MANIFESTS.find((manifest) => manifest.key === moduleKey);
