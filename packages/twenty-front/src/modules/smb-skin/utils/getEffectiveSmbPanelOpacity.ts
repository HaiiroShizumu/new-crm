import { SMB_PANEL_OPACITY_MIN } from '@/smb-skin/constants/SmbPanelOpacityMin';
import { type SmbThemeMode } from '@/smb-skin/types/SmbThemeMode';
import { clampNumber } from '@/smb-skin/utils/clampNumber';

// Light frost is eased down so white glass opens up like dark glass at the same slider value.
export const getEffectiveSmbPanelOpacity = (
  mode: SmbThemeMode,
  panelOpacity: number,
) => {
  const clampedOpacity = clampNumber(panelOpacity, SMB_PANEL_OPACITY_MIN, 1);

  return mode === 'light'
    ? clampNumber(clampedOpacity * 0.78, SMB_PANEL_OPACITY_MIN * 0.75, 1)
    : clampedOpacity;
};
