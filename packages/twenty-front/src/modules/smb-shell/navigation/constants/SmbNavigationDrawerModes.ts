import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';

// Режимы оболочки = режимы ящика ядра + наши. Наш режим не хранится в
// navigationDrawerActiveTabState (его тип задаёт ядро): он определяется адресом.
export const SMB_NAVIGATION_DRAWER_MODES = {
  ...NAVIGATION_DRAWER_TABS,
  MESSENGER: 'messenger',
} as const;

export type SmbNavigationDrawerMode =
  (typeof SMB_NAVIGATION_DRAWER_MODES)[keyof typeof SMB_NAVIGATION_DRAWER_MODES];
