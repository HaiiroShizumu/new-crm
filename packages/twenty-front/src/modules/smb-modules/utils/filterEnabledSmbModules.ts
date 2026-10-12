import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

// Модуль включён тогда и только тогда, когда установлен его App (ADR-009 п.3):
// один источник правды на фронте и на сервере. dependsOn на включение не
// влияет — он задаёт только порядок установки в пресете.
export const filterEnabledSmbModules = (
  manifests: readonly SmbModuleManifest[],
  installedUniversalIdentifiers: ReadonlySet<string>,
): SmbModuleManifest[] =>
  manifests.filter((manifest) =>
    installedUniversalIdentifiers.has(manifest.applicationUniversalIdentifier),
  );
