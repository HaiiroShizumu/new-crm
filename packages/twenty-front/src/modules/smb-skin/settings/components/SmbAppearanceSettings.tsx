import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { Section } from 'twenty-ui/components';
import { IconPencil, IconRefresh } from 'twenty-ui/icon';
import { Button, SegmentedControl } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { useEnterLayoutCustomizationMode } from '@/layout-customization/hooks/useEnterLayoutCustomizationMode';
import { OpenRecordInPreferencePicker } from '@/settings/experience/components/OpenRecordInPreferencePicker';
import { SettingsOptionCardContentSwitch } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSwitch';
import { SMB_DEFAULT_PANEL_OPACITY } from '@/smb-skin/constants/SmbDefaultPanelOpacity';
import { SMB_PANEL_OPACITY_MIN } from '@/smb-skin/constants/SmbPanelOpacityMin';
import { SmbAccentColorSetting } from '@/smb-skin/settings/components/SmbAccentColorSetting';
import { SmbSettingsSliderRow } from '@/smb-skin/settings/components/SmbSettingsSliderRow';
import { SmbWallpaperSetting } from '@/smb-skin/settings/components/SmbWallpaperSetting';
import { smbAccentFoldersState } from '@/smb-skin/states/smbAccentFoldersState';
import { smbBackgroundState } from '@/smb-skin/states/smbBackgroundState';
import { smbPanelFramesState } from '@/smb-skin/states/smbPanelFramesState';
import { smbPanelOpacityState } from '@/smb-skin/states/smbPanelOpacityState';
import { smbSidebarModeState } from '@/smb-skin/states/smbSidebarModeState';
import { smbSidebarOpenState } from '@/smb-skin/states/smbSidebarOpenState';
import { type SmbSidebarMode } from '@/smb-skin/types/SmbSidebarMode';
import { hasSmbWallpaper } from '@/smb-skin/utils/hasSmbWallpaper';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';
import { LayoutModeSetting } from '@/smb-ui-preferences/settings/components/LayoutModeSetting';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

type SmbSidebarDisplay = 'expanded' | 'icons' | 'hidden';

const StyledSectionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTabsRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]} 0;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StyledTabGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledTabLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StyledTwoColumn = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}
    ${themeCssVariables.spacing[3]};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledColumnTitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const StyledSliderStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSliderHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSliderLabel = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-width: 0;
`;

const StyledAccentBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

export const SmbAppearanceSettings = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enterLayoutCustomizationMode } = useEnterLayoutCustomizationMode();
  const [smbPanelFrames, setSmbPanelFrames] = usePersistedUiPreference(
    smbPanelFramesState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_FRAMES,
  );
  const [smbAccentFolders, setSmbAccentFolders] = usePersistedUiPreference(
    smbAccentFoldersState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_ACCENT_FOLDERS,
  );
  const [smbSidebarMode, setSmbSidebarMode] = usePersistedUiPreference(
    smbSidebarModeState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_MODE,
  );
  const [smbSidebarOpen, setSmbSidebarOpen] = usePersistedUiPreference(
    smbSidebarOpenState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_SIDEBAR_OPEN,
  );
  const [smbPanelOpacity, setSmbPanelOpacity] = usePersistedUiPreference(
    smbPanelOpacityState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_OPACITY,
  );
  const [smbBackground, setSmbBackground] = usePersistedUiPreference(
    smbBackgroundState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_BACKGROUND,
  );
  const [isNavigationDrawerExpanded, setIsNavigationDrawerExpanded] =
    useAtomState(isNavigationDrawerExpandedState);
  const [, setPersistedNavigationDrawerExpanded] = usePersistedUiPreference(
    isNavigationDrawerExpandedState,
    USER_VAR_UI_PREFERENCE_KEYS.NAVIGATION_DRAWER_EXPANDED,
  );

  const sidebarDisplay: SmbSidebarDisplay = !smbSidebarOpen
    ? 'hidden'
    : isNavigationDrawerExpanded
      ? 'expanded'
      : 'icons';

  const handleSidebarDisplayChange = async (display: SmbSidebarDisplay) => {
    await setSmbSidebarOpen(display !== 'hidden');

    if (display !== 'hidden') {
      const nextExpanded = display === 'expanded';

      setIsNavigationDrawerExpanded(nextExpanded);
      await setPersistedNavigationDrawerExpanded(nextExpanded);
    }
  };

  const handleCustomizeLayout = () => {
    if (enterLayoutCustomizationMode()) {
      navigate(AppPath.Index);
    }
  };

  const hasWallpaper = hasSmbWallpaper(smbBackground);
  const transparencyPercent = Math.round((1 - smbPanelOpacity) * 100);
  const dimPercent = Math.round(Math.abs(smbBackground.dim) * 100);
  const veilLabel =
    smbBackground.dim > 0
      ? t`Darken ${dimPercent}%`
      : smbBackground.dim < 0
        ? t`Lighten ${dimPercent}%`
        : t`Veil`;

  return (
    <Section.Root>
      <Section.Header
        title={t`SMB interface`}
        description={t`Wallpaper, panels and sidebar`}
      />
      <StyledSectionBody>
        <Card.Root rounded>
          <StyledTabsRow>
            <StyledTabGroup>
              <StyledTabLabel>{t`Sidebar style`}</StyledTabLabel>
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
            </StyledTabGroup>
            <StyledTabGroup>
              <StyledTabLabel>{t`Sidebar display`}</StyledTabLabel>
              <SegmentedControl<SmbSidebarDisplay>
                aria-label={t`Sidebar display`}
                itemWidth="equal"
                value={sidebarDisplay}
                onValueChange={(display) => {
                  void handleSidebarDisplayChange(display);
                }}
                options={[
                  { label: t`Expanded`, value: 'expanded' },
                  { label: t`Icons`, value: 'icons' },
                  { label: t`Hidden`, value: 'hidden' },
                ]}
              />
            </StyledTabGroup>
          </StyledTabsRow>

          <StyledTwoColumn>
            <StyledColumn>
              <StyledColumnTitle>{t`Wallpaper`}</StyledColumnTitle>
              <SmbWallpaperSetting />
              <StyledColumnTitle>{t`Макет навигации`}</StyledColumnTitle>
              <LayoutModeSetting />
              <Button
                size="sm"
                startIcon={<IconPencil />}
                onClick={handleCustomizeLayout}
                variant="solid"
                color="accent"
              >
                {t`Customize layout`}
              </Button>
              <StyledColumnTitle>{t`Navigation`}</StyledColumnTitle>
              <OpenRecordInPreferencePicker />
            </StyledColumn>

            <StyledColumn>
              <StyledColumnTitle>{t`Background & panels`}</StyledColumnTitle>
              <StyledSliderStack>
                <SmbSettingsSliderRow
                  label={veilLabel}
                  ariaLabel={t`Wallpaper veil`}
                  min={-1}
                  max={1}
                  step={0.01}
                  value={smbBackground.dim}
                  disabled={!hasWallpaper}
                  onChange={(dim) => {
                    void setSmbBackground((previousBackground) => ({
                      ...previousBackground,
                      dim,
                    }));
                  }}
                />
                <SmbSettingsSliderRow
                  label={t`Blur: ${smbBackground.blur}px`}
                  ariaLabel={t`Wallpaper blur`}
                  min={0}
                  max={40}
                  step={1}
                  value={smbBackground.blur}
                  disabled={!hasWallpaper}
                  onChange={(blur) => {
                    void setSmbBackground((previousBackground) => ({
                      ...previousBackground,
                      blur,
                    }));
                  }}
                />
                <div>
                  <StyledSliderHeader>
                    <StyledSliderLabel>
                      {t`Transparency: ${transparencyPercent}%`}
                    </StyledSliderLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      startIcon={<IconRefresh size={16} />}
                      onClick={() => {
                        void setSmbPanelOpacity(SMB_DEFAULT_PANEL_OPACITY);
                      }}
                    >
                      {t`Reset`}
                    </Button>
                  </StyledSliderHeader>
                  <SmbSettingsSliderRow
                    ariaLabel={t`Panel transparency`}
                    min={0}
                    max={1 - SMB_PANEL_OPACITY_MIN}
                    step={0.01}
                    value={1 - smbPanelOpacity}
                    onChange={(transparency) => {
                      void setSmbPanelOpacity(1 - transparency);
                    }}
                  />
                </div>
              </StyledSliderStack>

              <SettingsOptionCardContentSwitch
                title={t`Panel frames`}
                checked={smbPanelFrames}
                onChange={(checked) => {
                  void setSmbPanelFrames(checked);
                }}
              />
              <SettingsOptionCardContentSwitch
                title={t`Accent folders`}
                checked={smbAccentFolders}
                onChange={(checked) => {
                  void setSmbAccentFolders(checked);
                }}
              />

              <StyledAccentBlock>
                <StyledSliderLabel>{t`Accent color`}</StyledSliderLabel>
                <SmbAccentColorSetting />
              </StyledAccentBlock>
            </StyledColumn>
          </StyledTwoColumn>
        </Card.Root>
      </StyledSectionBody>
    </Section.Root>
  );
};
