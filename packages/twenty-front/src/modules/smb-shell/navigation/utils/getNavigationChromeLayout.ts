import { type LayoutMode } from '@/smb-ui-preferences/types/LayoutMode';
import { type NavigationChromeLayout } from '@/smb-shell/navigation/types/NavigationChromeLayout';

export const getNavigationChromeLayout = (
  layoutMode: LayoutMode,
): NavigationChromeLayout => {
  switch (layoutMode) {
    case 'linked-tabs':
      return {
        showSidebar: true,
        showTopModeTabs: true,
        showTopWorkspaceTabs: false,
        showDrawerModeSwitcher: false,
        showIconRail: false,
        showSecondarySidebar: false,
        showModesOnlyInSidebar: false,
        messengerListZone: 'sidebar',
      };
    case 'inverted-tabs':
      return {
        showSidebar: true,
        showTopModeTabs: false,
        showTopWorkspaceTabs: true,
        showDrawerModeSwitcher: false,
        showIconRail: false,
        showSecondarySidebar: false,
        showModesOnlyInSidebar: true,
        messengerListZone: 'none',
      };
    case 'sidebar-tabs':
      return {
        showSidebar: true,
        showTopModeTabs: false,
        showTopWorkspaceTabs: false,
        showDrawerModeSwitcher: true,
        showIconRail: false,
        showSecondarySidebar: false,
        showModesOnlyInSidebar: false,
        messengerListZone: 'sidebar',
      };
    case 'two-level':
      return {
        showSidebar: true,
        showTopModeTabs: false,
        showTopWorkspaceTabs: false,
        showDrawerModeSwitcher: false,
        showIconRail: true,
        showSecondarySidebar: true,
        showModesOnlyInSidebar: false,
        messengerListZone: 'sidebar',
      };
    case 'sidebar-only':
      return {
        showSidebar: true,
        showTopModeTabs: false,
        showTopWorkspaceTabs: false,
        showDrawerModeSwitcher: true,
        showIconRail: false,
        showSecondarySidebar: false,
        showModesOnlyInSidebar: false,
        messengerListZone: 'sidebar',
      };
    case 'tabs-only':
      return {
        showSidebar: false,
        showTopModeTabs: true,
        showTopWorkspaceTabs: true,
        showDrawerModeSwitcher: false,
        showIconRail: false,
        showSecondarySidebar: false,
        showModesOnlyInSidebar: false,
        messengerListZone: 'content',
      };
  }
};
