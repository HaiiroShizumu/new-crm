import { SMB_CONVERSATIONS_PATH } from '@/smb-conversations/constants/SmbConversationsPath';
import { isSmbConversationsPath } from '@/smb-conversations/utils/isSmbConversationsPath';
import {
  SMB_NAVIGATION_DRAWER_MODES,
  type SmbNavigationDrawerMode,
} from '@/smb-shell/navigation/constants/SmbNavigationDrawerModes';
import { useIsMobile } from 'twenty-ui/utilities';
import { useLocation, useNavigate } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';

import { useReturnFromExpandedAiChat } from '@/ai/hooks/useReturnFromExpandedAiChat';
import { useSwitchToNewAiChat } from '@/ai/hooks/useSwitchToNewAiChat';
import { getExpandedAiChatReturnLocation } from '@/ai/utils/getExpandedAiChatReturnLocation';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useDefaultHomePagePath } from '@/smb-shell/navigation/hooks/useDefaultHomePagePath';
import { useIsSettingsDrawer } from '@/smb-shell/navigation/hooks/useIsSettingsDrawer';
import { useIsSettingsPage } from '@/smb-shell/navigation/hooks/useIsSettingsPage';
import { currentMobileNavigationDrawerState } from '@/smb-shell/navigation/states/currentMobileNavigationDrawerState';
import { getNavigationDrawerHomeDestination } from '@/smb-shell/navigation/utils/getNavigationDrawerHomeDestination';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerActiveTabState } from '@/ui/navigation/states/navigationDrawerActiveTabState';
import { navigationDrawerExpandedMemorizedState } from '@/ui/navigation/states/navigationDrawerExpandedMemorizedState';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { isAiChatPath } from '~/utils/isAiChatPath';

export const useSwitchNavigationDrawerMode = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const navigateSettings = useNavigateSettings();

  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const isSettingsDrawer = useIsSettingsDrawer();
  const isSettingsPage = useIsSettingsPage();
  const isAiChatPage = isAiChatPath(location.pathname);
  const isMessengerPage = isSmbConversationsPath(location.pathname);

  const navigationMemorizedUrl = useAtomStateValue(navigationMemorizedUrlState);
  const navigationDrawerExpandedMemorized = useAtomStateValue(
    navigationDrawerExpandedMemorizedState,
  );
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );
  const setCurrentMobileNavigationDrawer = useSetAtomState(
    currentMobileNavigationDrawerState,
  );
  const setNavigationDrawerActiveTab = useSetAtomState(
    navigationDrawerActiveTabState,
  );

  const { defaultHomePagePath } = useDefaultHomePagePath();
  const { switchToNewChat } = useSwitchToNewAiChat({
    shouldOpenInFullPage: true,
  });
  const returnFromExpandedAiChat = useReturnFromExpandedAiChat({
    reopenSidePanel: false,
    destinationPath: getNavigationDrawerHomeDestination({
      memorizedUrl: getExpandedAiChatReturnLocation(location.state),
      defaultHomePagePath,
    }),
  });

  const switchToNavigationMenu = () => {
    setNavigationDrawerActiveTab(NAVIGATION_DRAWER_TABS.NAVIGATION_MENU);

    if (isSettingsDrawer) {
      setCurrentMobileNavigationDrawer('main');
      if (isMobile) {
        setIsNavigationDrawerExpanded(navigationDrawerExpandedMemorized);
      }
      navigate(
        getNavigationDrawerHomeDestination({
          memorizedUrl: navigationMemorizedUrl,
          defaultHomePagePath,
        }),
        { replace: true },
      );
      return;
    }

    if (isAiChatPage) {
      returnFromExpandedAiChat();
      return;
    }

    if (isMessengerPage) {
      navigate(
        getNavigationDrawerHomeDestination({
          memorizedUrl: navigationMemorizedUrl,
          defaultHomePagePath,
        }),
      );
    }
  };

  const switchToAiChat = () => {
    setCurrentMobileNavigationDrawer('main');
    setNavigationDrawerActiveTab(NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY);
    switchToNewChat();
  };

  // The AI mode also covers the chat history listed next to another page, so it
  // is the chat page rather than the active mode that makes a click a no-op.
  const switchNavigationDrawerMode = (mode: SmbNavigationDrawerMode) => {
    switch (mode) {
      case NAVIGATION_DRAWER_TABS.NAVIGATION_MENU:
        if (
          activeNavigationDrawerMode === NAVIGATION_DRAWER_TABS.NAVIGATION_MENU
        ) {
          return;
        }
        switchToNavigationMenu();
        break;
      case SMB_NAVIGATION_DRAWER_MODES.MESSENGER:
        if (isMessengerPage) {
          return;
        }
        // Режим «Чаты» задаётся адресом; сохранённая вкладка остаётся «домом»,
        // чтобы уход со страницы чатов возвращал обычное меню.
        setCurrentMobileNavigationDrawer('main');
        setNavigationDrawerActiveTab(NAVIGATION_DRAWER_TABS.NAVIGATION_MENU);
        navigate(SMB_CONVERSATIONS_PATH);
        break;
      case NAVIGATION_DRAWER_TABS.AI_CHAT_HISTORY:
        if (isAiChatPage) {
          return;
        }
        switchToAiChat();
        break;
      case NAVIGATION_DRAWER_TABS.SETTINGS:
        // The mobile settings drawer outlives the route that opened it, a
        // browser back out of settings for one, so the page rather than the
        // drawer says whether there is anywhere left to go. Desktop has no
        // such split: there the two are the same thing.
        if (isSettingsPage) {
          return;
        }
        navigateSettings(SettingsPath.ProfilePage);
        break;
    }
  };

  return { switchNavigationDrawerMode };
};
