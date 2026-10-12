import { type ComponentType } from 'react';

export type SmbModuleRoute = {
  // Абсолютный путь внутри воркспейса ('/absences'); уникален среди модулей.
  path: string;
  loader: () => Promise<{ default: ComponentType }>;
};

export type SmbModuleNavigationItem = {
  labelKey: string;
  icon: string;
  to: string;
  group: string;
};

export type SmbModuleRecordTab = {
  objectUniversalIdentifier: string;
  path: string;
  labelKey: string;
  icon: string;
};

export type SmbModuleEmbedSurface = {
  path: string;
};

export type SmbModuleManifest = {
  key: string;
  applicationUniversalIdentifier: string;
  dependsOn: readonly string[];
  routes: readonly SmbModuleRoute[];
  navigation: readonly SmbModuleNavigationItem[];
  recordTabs: readonly SmbModuleRecordTab[];
  embed: SmbModuleEmbedSurface | null;
};
