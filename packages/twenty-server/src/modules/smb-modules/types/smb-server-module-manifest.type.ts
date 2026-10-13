// Серверное зеркало манифеста модуля (ADR-009 п.2: на фронте тип живёт в
// smb-modules, здесь — соответственно). expectedVersion — версия App,
// зашитая в код образа: её с установленной сверяет M-7.
export type SmbServerModuleManifest = {
  key: string;
  applicationUniversalIdentifier: string;
  expectedVersion: string;
};
