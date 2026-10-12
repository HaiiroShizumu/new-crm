import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { type ChangeEvent, useRef, useState } from 'react';
import { IconRefresh, IconUpload } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SMB_DEFAULT_BACKGROUND } from '@/smb-skin/constants/SmbDefaultBackground';
import { SMB_WALLPAPER_PRESETS } from '@/smb-skin/constants/SmbWallpaperPresets';
import { smbBackgroundState } from '@/smb-skin/states/smbBackgroundState';
import { compressSmbWallpaper } from '@/smb-skin/utils/compressSmbWallpaper';
import { hasSmbWallpaper } from '@/smb-skin/utils/hasSmbWallpaper';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';

const StyledWallpaperSetting = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledPresetGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  grid-template-columns: repeat(5, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const StyledPresetCard = styled.button`
  background-color: ${themeCssVariables.background.tertiary};
  background-position: center;
  background-size: cover;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  height: 36px;
  padding: 0;
  transition: border-color 0.15s ease;
  width: 100%;

  &:hover {
    border-color: ${themeCssVariables.border.color.blue};
  }

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.color.blue};
    box-shadow: inset 0 0 0 1px ${themeCssVariables.color.blue};
  }
`;

const StyledCustomRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledUrlField = styled.div`
  flex: 1 1 120px;
  min-width: 0;
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledHiddenFileInput = styled.input`
  display: none;
`;

export const SmbWallpaperSetting = () => {
  const { t, i18n } = useLingui();
  const [smbBackground, setSmbBackground] = usePersistedUiPreference(
    smbBackgroundState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_BACKGROUND,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasWallpaper = hasSmbWallpaper(smbBackground);
  const typedUrl =
    hasWallpaper && smbBackground.url?.startsWith('data:') !== true
      ? (smbBackground.url ?? '')
      : '';
  const [urlDraft, setUrlDraft] = useState(typedUrl);

  const applyWallpaperUrl = (url: string | null) => {
    setUploadError(null);
    setUrlDraft(url?.startsWith('data:') === true ? '' : (url ?? ''));
    setSmbBackground((previousBackground) => ({
      ...previousBackground,
      type: isNonEmptyString(url) ? 'image' : 'none',
      url: isNonEmptyString(url) ? url : null,
    }));
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (file === undefined) {
      return;
    }

    setIsCompressing(true);
    setUploadError(null);

    try {
      applyWallpaperUrl(await compressSmbWallpaper(file));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : t`Could not load the image.`,
      );
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <StyledWallpaperSetting>
      <StyledPresetGrid>
        {SMB_WALLPAPER_PRESETS.map((preset) => (
          <StyledPresetCard
            key={preset.id}
            type="button"
            aria-label={i18n._(preset.label)}
            title={i18n._(preset.label)}
            aria-pressed={hasWallpaper && smbBackground.url === preset.url}
            style={{ backgroundImage: `url("${preset.url}")` }}
            onClick={() => applyWallpaperUrl(preset.url)}
          />
        ))}
      </StyledPresetGrid>

      <StyledCustomRow>
        <StyledUrlField>
          <SettingsTextInput
            instanceId="smb-wallpaper-url-input"
            placeholder={t`Image URL`}
            value={urlDraft}
            onChange={setUrlDraft}
            onBlur={() => applyWallpaperUrl(urlDraft.trim())}
            onInputEnter={() => applyWallpaperUrl(urlDraft.trim())}
          />
        </StyledUrlField>
        <Button
          variant="outline"
          size="sm"
          startIcon={<IconUpload size={16} />}
          loading={isCompressing}
          disabled={isCompressing}
          onClick={() => fileInputRef.current?.click()}
        >
          {isCompressing ? t`…` : t`Upload`}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          startIcon={<IconRefresh size={16} />}
          onClick={() => {
            setUploadError(null);
            setUrlDraft('');
            setSmbBackground(SMB_DEFAULT_BACKGROUND);
          }}
        >
          {t`Reset`}
        </Button>
        <StyledHiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </StyledCustomRow>
      {isNonEmptyString(uploadError) && (
        <StyledError>{uploadError}</StyledError>
      )}
    </StyledWallpaperSetting>
  );
};
