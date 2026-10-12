export type MessengerListZone = 'sidebar' | 'content' | 'none';

export type NavigationChromeLayout = {
  showSidebar: boolean;
  showTopModeTabs: boolean;
  showTopWorkspaceTabs: boolean;
  showDrawerModeSwitcher: boolean;
  showIconRail: boolean;
  showSecondarySidebar: boolean;
  showModesOnlyInSidebar: boolean;
  messengerListZone: MessengerListZone;
};
