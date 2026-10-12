import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

// Реестр модулей форка (ADR-009 п.4): одна строка на модуль.
// Генератор `yarn smb:module new <key>` вставляет import и элемент массива
// по маркерам ниже — см. docs/dev/module-authoring.md. Маркеры стоят ровно
// по одному разу, каждый в своём месте.
// smb:module:imports

// dependsOn участвует только в порядке установки пресета (ADR-006), не во
// включении: модуль включён тогда и только тогда, когда установлен его App.
export const SMB_MODULE_MANIFESTS: SmbModuleManifest[] = [
  // smb:module:list
];

export const getSmbModuleManifestByKey = (
  key: string,
): SmbModuleManifest | undefined =>
  SMB_MODULE_MANIFESTS.find((manifest) => manifest.key === key);
