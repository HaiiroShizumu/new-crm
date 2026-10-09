import { type SmbThemeMode } from '@/smb-skin/types/SmbThemeMode';
import { clampNumber } from '@/smb-skin/utils/clampNumber';
import { getRelativeLuminance } from '@/smb-skin/utils/getRelativeLuminance';

export const getFrostedPanelLuminance = (
  wallpaperLuminance: number,
  mode: SmbThemeMode,
  panelOpacity: number,
) => {
  const surfaceLuminance =
    mode === 'light'
      ? getRelativeLuminance(255, 255, 255)
      : getRelativeLuminance(30, 30, 30);
  const opacity = clampNumber(panelOpacity, 0, 1);

  return wallpaperLuminance * (1 - opacity) + surfaceLuminance * opacity;
};
