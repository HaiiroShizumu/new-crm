import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { SMB_ACCENT_PRESETS } from '@/smb-skin/constants/SmbAccentPresets';
import { smbAccentState } from '@/smb-skin/states/smbAccentState';
import { isSmbHexColor } from '@/smb-skin/utils/isSmbHexColor';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';

const StyledAccentSetting = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSwatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSwatch = styled.button`
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  height: 28px;
  outline: 2px solid transparent;
  padding: 0;
  width: 28px;

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.font.color.primary};
    outline-color: ${themeCssVariables.background.primary};
  }
`;

const StyledCustomColorRow = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 160px;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledNativeColorInput = styled.input`
  background: none;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  cursor: pointer;
  flex-shrink: 0;
  height: 28px;
  padding: 2px;
  width: 40px;
`;

export const SmbAccentColorSetting = () => {
  const { t } = useLingui();
  const [smbAccent, setSmbAccent] = usePersistedUiPreference(
    smbAccentState,
    USER_VAR_UI_PREFERENCE_KEYS.SMB_ACCENT,
  );
  const [hexDraft, setHexDraft] = useState(smbAccent);

  const applyAccent = (accent: string) => {
    void setSmbAccent(accent);
    setHexDraft(accent);
  };

  const handleHexDraftChange = (value: string) => {
    setHexDraft(value);

    if (isSmbHexColor(value)) {
      void setSmbAccent(value);
    }
  };

  return (
    <StyledAccentSetting>
      <StyledSwatches>
        {SMB_ACCENT_PRESETS.map((presetAccent) => (
          <StyledSwatch
            key={presetAccent}
            type="button"
            aria-label={presetAccent}
            aria-pressed={
              presetAccent.toLowerCase() === smbAccent.toLowerCase()
            }
            style={{ backgroundColor: presetAccent }}
            onClick={() => applyAccent(presetAccent)}
          />
        ))}
      </StyledSwatches>
      <StyledCustomColorRow>
        <StyledNativeColorInput
          type="color"
          aria-label={t`Pick a custom accent color`}
          value={smbAccent}
          onChange={(event) => applyAccent(event.target.value)}
        />
        <SettingsTextInput
          instanceId="smb-accent-hex-input"
          value={hexDraft}
          onChange={handleHexDraftChange}
          onBlur={() => setHexDraft(smbAccent)}
        />
      </StyledCustomColorRow>
    </StyledAccentSetting>
  );
};
