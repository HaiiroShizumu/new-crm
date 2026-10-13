import { type IconComponent } from 'twenty-ui/icon';

import { type SmbNavigationDrawerMode } from '@/smb-shell/navigation/constants/SmbNavigationDrawerModes';

export type MenuSearchEntrySection = 'mode' | 'menu' | 'settings';

export type MenuSearchEntry = {
  id: string;
  label: string;
  path: string;
  Icon: IconComponent;
  section: MenuSearchEntrySection;
  mode?: SmbNavigationDrawerMode;
};
