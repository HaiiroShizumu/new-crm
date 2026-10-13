import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SettingsOptionCardContentSwitch } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSwitch';
import { SMB_DEFAULT_BACKGROUND } from '@/smb-skin/constants/SmbDefaultBackground';
import { SMB_DEFAULT_PANEL_OPACITY } from '@/smb-skin/constants/SmbDefaultPanelOpacity';
import { SMB_PANEL_OPACITY_MIN } from '@/smb-skin/constants/SmbPanelOpacityMin';
import { SmbSettingsSliderRow } from '@/smb-skin/settings/components/SmbSettingsSliderRow';
import { smbBackgroundState } from '@/smb-skin/states/smbBackgroundState';
import { smbPanelFramesState } from '@/smb-skin/states/smbPanelFramesState';
import { smbPanelOpacityState } from '@/smb-skin/states/smbPanelOpacityState';
import { hasSmbWallpaper } from '@/smb-skin/utils/hasSmbWallpaper';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';

const StyledSliders = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledFooter = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
`;

export const SmbBackgroundPanelsSetting = () => {
  const { t } = useLingui();
  const [smbBackground, setSmbBackground] = usePersistedUiPreference(
    smbBackgroundState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_BACKGROUND,
  );
  const [smbPanelOpacity, setSmbPanelOpacity] = usePersistedUiPreference(
    smbPanelOpacityState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_OPACITY,
  );
  const [smbPanelFrames, setSmbPanelFrames] = usePersistedUiPreference(
    smbPanelFramesState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_PANEL_FRAMES,
  );

  const hasWallpaper = hasSmbWallpaper(smbBackground);
  const transparencyPercent = Math.round((1 - smbPanelOpacity) * 100);
  const dimPercent = Math.round(Math.abs(smbBackground.dim) * 100);
  const veilValueLabel =
    smbBackground.dim > 0
      ? t`Darker ${dimPercent}%`
      : smbBackground.dim < 0
        ? t`Lighter ${dimPercent}%`
        : t`Off`;

  const handleReset = () => {
    void setSmbPanelOpacity(SMB_DEFAULT_PANEL_OPACITY);
    void setSmbBackground((previousBackground) => ({
      ...previousBackground,
      dim: SMB_DEFAULT_BACKGROUND.dim,
      blur: SMB_DEFAULT_BACKGROUND.blur,
    }));
  };

  return (
    <>
      <StyledSliders>
        <SmbSettingsSliderRow
          label={t`Panel transparency`}
          valueLabel={`${transparencyPercent}%`}
          ariaLabel={t`Panel transparency`}
          min={0}
          max={1 - SMB_PANEL_OPACITY_MIN}
          step={0.01}
          value={1 - smbPanelOpacity}
          onChange={(transparency) => {
            void setSmbPanelOpacity(1 - transparency);
          }}
        />
        <SmbSettingsSliderRow
          label={t`Wallpaper blur`}
          valueLabel={`${smbBackground.blur}px`}
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
        <SmbSettingsSliderRow
          label={t`Wallpaper veil`}
          valueLabel={veilValueLabel}
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
      </StyledSliders>
      <SettingsOptionCardContentSwitch
        title={t`Panel frames`}
        description={t`Show pages inside a frosted glass panel`}
        checked={smbPanelFrames}
        onChange={(checked) => {
          void setSmbPanelFrames(checked);
        }}
      />
      <StyledFooter>
        <Button
          variant="ghost"
          size="sm"
          startIcon={<IconRefresh size={16} />}
          onClick={handleReset}
        >
          {t`Reset`}
        </Button>
      </StyledFooter>
    </>
  );
};
