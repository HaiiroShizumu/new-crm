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
  // Платформенный модуль есть в каждой компании и не имеет App-выключателя
  // (уведомления, беседы — ADR-010). Для него applicationUniversalIdentifier
  // служит только ключом и ни с каким установленным App не сверяется.
  isPlatform?: boolean;
  applicationUniversalIdentifier: string;
  dependsOn: readonly string[];
  routes: readonly SmbModuleRoute[];
  navigation: readonly SmbModuleNavigationItem[];
  recordTabs: readonly SmbModuleRecordTab[];
  embed: SmbModuleEmbedSurface | null;
};
