import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { LightIconButton } from 'twenty-ui/components';
import { IconLayoutSidebar, IconSearch, IconSettings } from 'twenty-ui/icon';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { NavigationModePillTabs } from '@/smb-shell/navigation/components/NavigationModePillTabs';
import { TopWorkspaceNavigationTabs } from '@/smb-shell/navigation/components/TopWorkspaceNavigationTabs';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { useNavigationDrawerExpanded } from '@/smb-shell/navigation/hooks/useNavigationDrawerExpanded';
import { useOpenMenuSearchPalette } from '@/smb-shell/navigation/hooks/useOpenMenuSearchPalette';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { SmbTopBarClock } from '@/smb-skin/components/SmbTopBarClock';
import { SmbTopBarWorkdayStatus } from '@/smb-skin/components/SmbTopBarWorkdayStatus';
import { useSmbChromePortal } from '@/smb-skin/hooks/useSmbChromePortal';
import { smbChromeTopBarActionsHostState } from '@/smb-skin/states/smbChromeTopBarActionsHostState';
import { smbSidebarOpenState } from '@/smb-skin/states/smbSidebarOpenState';
import { MultiWorkspaceDropdownButton } from '@/ui/navigation/navigation-drawer/components/MultiWorkspaceDropdown/MultiWorkspaceDropdownButton';
import { NavigationDrawerCollapseButton } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerCollapseButton';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledStart = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  grid-column: 1;
  min-width: 0;
`;

const StyledPageTitleSlot = styled.div`
  align-items: center;
  display: flex;
  min-width: 0;
  overflow: hidden;
`;

const StyledCenter = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: 2;
  justify-content: center;
  min-width: 0;
`;

const StyledPageActionsSlot = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
  min-width: 0;

  &:empty {
    display: none;
  }
`;

const StyledEnd = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
  grid-column: 3;
  justify-self: end;
  min-width: 0;
`;

export const SmbTopBarContent = () => {
  const { t } = useLingui();
  const [smbSidebarOpen, setSmbSidebarOpen] = useAtomState(smbSidebarOpenState);
  const isNavigationDrawerExpanded = useNavigationDrawerExpanded();
  const { showSidebar, showTopModeTabs, showTopWorkspaceTabs } =
    useNavigationChromeLayout();
  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();
  const { openMenuSearchPalette } = useOpenMenuSearchPalette();
  const { setTitle: setSmbChromeTitlePortal } = useSmbChromePortal();
  const setSmbChromeTopBarActionsHost = useSetAtomState(
    smbChromeTopBarActionsHostState,
  );
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  const showWorkspaceTabs =
    showTopWorkspaceTabs &&
    activeNavigationDrawerMode === NAVIGATION_DRAWER_TABS.NAVIGATION_MENU;

  const isSettingsActive =
    activeNavigationDrawerMode === NAVIGATION_DRAWER_TABS.SETTINGS;
  const isSettingsDisabled = isLayoutCustomizationModeEnabled;

  return (
    <>
      <StyledStart>
        {showSidebar && !smbSidebarOpen && (
          <LightIconButton
            emphasis="standard"
            size="md"
            aria-label={t`Show menu`}
            onClick={() => setSmbSidebarOpen(true)}
          >
            <IconLayoutSidebar />
          </LightIconButton>
        )}
        {showSidebar && smbSidebarOpen && !isNavigationDrawerExpanded && (
          <NavigationDrawerCollapseButton direction="right" />
        )}
        <StyledPageTitleSlot
          data-smb-chrome-title
          ref={setSmbChromeTitlePortal}
        />
      </StyledStart>
      <StyledCenter>
        {showTopModeTabs && <NavigationModePillTabs />}
        {showWorkspaceTabs && <TopWorkspaceNavigationTabs />}
      </StyledCenter>
      <StyledEnd data-smb-top-actions>
        <StyledPageActionsSlot
          data-smb-chrome-actions
          ref={setSmbChromeTopBarActionsHost}
        />
        <LightIconButton
          emphasis="standard"
          size="md"
          aria-label={t`Settings`}
          aria-current={isSettingsActive || undefined}
          aria-disabled={isSettingsDisabled}
          disabled={isSettingsDisabled}
          tooltip={
            isSettingsDisabled
              ? t`Finish editing the layout to open Settings`
              : t`Settings`
          }
          onClick={() => {
            if (isSettingsDisabled) {
              return;
            }

            switchNavigationDrawerMode(NAVIGATION_DRAWER_TABS.SETTINGS);
          }}
        >
          <IconSettings />
        </LightIconButton>
        <LightIconButton
          emphasis="standard"
          size="md"
          aria-label={t`Search menu`}
          tooltip={t`Search menu`}
          onClick={openMenuSearchPalette}
        >
          <IconSearch />
        </LightIconButton>
        <SmbTopBarWorkdayStatus />
        <SmbTopBarClock />
        <MultiWorkspaceDropdownButton shouldHideLabel />
      </StyledEnd>
    </>
  );
};
