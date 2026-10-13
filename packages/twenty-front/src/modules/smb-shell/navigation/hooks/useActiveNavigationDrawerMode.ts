import { useLocation } from 'react-router-dom';

import { isSmbConversationsPath } from '@/smb-conversations/utils/isSmbConversationsPath';
import {
  SMB_NAVIGATION_DRAWER_MODES,
  type SmbNavigationDrawerMode,
} from '@/smb-shell/navigation/constants/SmbNavigationDrawerModes';
import { useIsSettingsDrawer } from '@/smb-shell/navigation/hooks/useIsSettingsDrawer';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isAiChatPath } from '~/utils/isAiChatPath';

// U-2 (перенос v2.42.6 -> v2.45.6): режимы MESSENGER и DOC_MANAGEMENT в
// NAVIGATION_DRAWER_TABS больше нет — эти разделы станут модулями реестра
// (C-блок, D-блок), а не режимами ящика. Остались режимы штатной базы.
// Settings и AI chat по-прежнему решаются маршрутом; сохранённая вкладка —
// только когда ни одна из этих страниц не открыта.
export const useActiveNavigationDrawerMode = (): SmbNavigationDrawerMode => {
  const { pathname } = useLocation();
  const isSettingsDrawer = useIsSettingsDrawer();
  const navigationDrawerActiveTab = useAtomStateValue(
    navigationDrawerActiveTabState,
  );

  if (isSettingsDrawer) {
    return NAVIGATION_DRAWER_TABS.SETTINGS;
  }

  if (isSmbConversationsPath(pathname)) {
    return SMB_NAVIGATION_DRAWER_MODES.MESSENGER;
  }

  if (
    isAiChatPath(pathname) ||
    navigationDrawerActiveTab === NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY
  ) {
    return NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY;
  }

  return NAVIGATION_DRAWER_TABS.NAVIGATION_MENU;
};
