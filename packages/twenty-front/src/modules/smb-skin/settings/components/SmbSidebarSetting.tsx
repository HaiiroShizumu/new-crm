import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { SegmentedControl } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { smbSidebarModeState } from '@/smb-skin/states/smbSidebarModeState';
import { smbSidebarOpenState } from '@/smb-skin/states/smbSidebarOpenState';
import { type SmbSidebarMode } from '@/smb-skin/types/SmbSidebarMode';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';

type SmbSidebarDisplay = 'expanded' | 'icons' | 'hidden';

const StyledControls = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: ${themeCssVariables.spacing[4]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StyledControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledControlLabel = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const SmbSidebarSetting = () => {
  const { t } = useLingui();
  const [smbSidebarMode, setSmbSidebarMode] = usePersistedUiPreference(
    smbSidebarModeState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_MODE,
  );
  const [smbSidebarOpen, setSmbSidebarOpen] = usePersistedUiPreference(
    smbSidebarOpenState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_OPEN,
  );
  const [isNavigationDrawerExpanded, setIsNavigationDrawerExpanded] =
    usePersistedUiPreference(
      isNavigationDrawerExpandedState,
      USER_VAR_UI_PREFERENCE_KEYS.NAVIGATION_DRAWER_EXPANDED,
    );

  const sidebarDisplay: SmbSidebarDisplay = !smbSidebarOpen
    ? 'hidden'
    : isNavigationDrawerExpanded
      ? 'expanded'
      : 'icons';

  const handleSidebarDisplayChange = (display: SmbSidebarDisplay) => {
    void setSmbSidebarOpen(display !== 'hidden');

    if (display !== 'hidden') {
      void setIsNavigationDrawerExpanded(display === 'expanded');
    }
  };

  return (
    <StyledControls>
      <StyledControl>
        <StyledControlLabel>{t`Sidebar style`}</StyledControlLabel>
        <SegmentedControl<SmbSidebarMode>
          aria-label={t`Sidebar style`}
          itemWidth="equal"
          value={smbSidebarMode}
          onValueChange={(mode) => {
            void setSmbSidebarMode(mode);
          }}
          options={[
            { label: t`Floating`, value: 'floating' },
            { label: t`Edge`, value: 'edge' },
          ]}
        />
      </StyledControl>
      <StyledControl>
        <StyledControlLabel>{t`Sidebar display`}</StyledControlLabel>
        <SegmentedControl<SmbSidebarDisplay>
          aria-label={t`Sidebar display`}
          itemWidth="equal"
          value={sidebarDisplay}
          onValueChange={handleSidebarDisplayChange}
          options={[
            { label: t`Expanded`, value: 'expanded' },
            { label: t`Icons`, value: 'icons' },
            { label: t`Hidden`, value: 'hidden' },
          ]}
        />
      </StyledControl>
    </StyledControls>
  );
};
