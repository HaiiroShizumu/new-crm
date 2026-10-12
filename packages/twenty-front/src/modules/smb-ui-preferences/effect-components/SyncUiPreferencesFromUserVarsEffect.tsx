import { useEffect } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { layoutModeState } from '@/smb-ui-preferences/states/layoutModeState';
import { isLayoutMode } from '@/smb-ui-preferences/types/LayoutMode';
import { smbAccentFoldersState } from '@/smb-skin/states/smbAccentFoldersState';
import { smbAccentState } from '@/smb-skin/states/smbAccentState';
import { smbBackgroundState } from '@/smb-skin/states/smbBackgroundState';
import { smbPanelFramesState } from '@/smb-skin/states/smbPanelFramesState';
import { smbPanelOpacityState } from '@/smb-skin/states/smbPanelOpacityState';
import { smbSidebarModeState } from '@/smb-skin/states/smbSidebarModeState';
import { smbSidebarOpenState } from '@/smb-skin/states/smbSidebarOpenState';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { isBoolean, isNumber, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

export const SyncUiPreferencesFromUserVarsEffect = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const setLayoutMode = useSetAtomState(layoutModeState);
  const setSmbSidebarMode = useSetAtomState(smbSidebarModeState);
  const setSmbSidebarOpen = useSetAtomState(smbSidebarOpenState);
  const setSmbPanelOpacity = useSetAtomState(smbPanelOpacityState);
  const setSmbPanelFrames = useSetAtomState(smbPanelFramesState);
  const setSmbAccentFolders = useSetAtomState(smbAccentFoldersState);
  const setSmbAccent = useSetAtomState(smbAccentState);
  const setSmbBackground = useSetAtomState(smbBackgroundState);
  const setIsNavigationDrawerExpanded = useSetAtomState(
    isNavigationDrawerExpandedState,
  );

  useEffect(() => {
    const userVars = currentUser?.userVars;

    if (!isDefined(userVars)) {
      return;
    }

    const layoutMode = userVars[USER_VAR_UI_PREFERENCE_KEYS.LAYOUT_MODE];

    if (isLayoutMode(layoutMode)) {
      setLayoutMode(layoutMode);
    } else if (
      isDefined(userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_MODE]) ||
      isDefined(userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_BACKGROUND])
    ) {
      // Legacy SMB sessions had top mode pills without a stored layout mode.
      setLayoutMode('linked-tabs');
    }

    const smbSidebarMode =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_MODE];

    if (smbSidebarMode === 'floating' || smbSidebarMode === 'edge') {
      setSmbSidebarMode(smbSidebarMode);
    }

    const smbSidebarOpen =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_OPEN];

    if (isBoolean(smbSidebarOpen)) {
      setSmbSidebarOpen(smbSidebarOpen);
    }

    const smbPanelOpacity =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_OPACITY];

    if (isNumber(smbPanelOpacity)) {
      setSmbPanelOpacity(smbPanelOpacity);
    }

    const smbPanelFrames =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_FRAMES];

    if (isBoolean(smbPanelFrames)) {
      setSmbPanelFrames(smbPanelFrames);
    }

    const smbAccentFolders =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_ACCENT_FOLDERS];

    if (isBoolean(smbAccentFolders)) {
      setSmbAccentFolders(smbAccentFolders);
    }

    const smbAccent = userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_ACCENT];

    if (isString(smbAccent)) {
      setSmbAccent(smbAccent);
    }

    const smbBackground = userVars[USER_VAR_UI_PREFERENCE_KEYS.SMB_BACKGROUND];

    if (isDefined(smbBackground) && typeof smbBackground === 'object') {
      setSmbBackground(smbBackground as never);
    }

    const navigationDrawerExpanded =
      userVars[USER_VAR_UI_PREFERENCE_KEYS.NAVIGATION_DRAWER_EXPANDED];

    if (isBoolean(navigationDrawerExpanded)) {
      setIsNavigationDrawerExpanded(navigationDrawerExpanded);
    }
  }, [
    currentUser?.id,
    currentUser?.userVars,
    setIsNavigationDrawerExpanded,
    setLayoutMode,
    setSmbAccent,
    setSmbAccentFolders,
    setSmbBackground,
    setSmbPanelFrames,
    setSmbPanelOpacity,
    setSmbSidebarMode,
    setSmbSidebarOpen,
  ]);

  return null;
};
