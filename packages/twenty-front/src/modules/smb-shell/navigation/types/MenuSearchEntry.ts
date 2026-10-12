import { type IconComponent } from 'twenty-ui/icon';

import { type NavigationDrawerActiveTab } from '@/ui/navigation/states/navigationDrawerTabs';

export type MenuSearchEntrySection = 'mode' | 'menu' | 'settings';

export type MenuSearchEntry = {
  id: string;
  label: string;
  path: string;
  Icon: IconComponent;
  section: MenuSearchEntrySection;
  mode?: NavigationDrawerActiveTab;
};
