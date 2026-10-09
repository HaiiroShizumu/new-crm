/* oxlint-disable twenty/no-hardcoded-colors */
import { type SmbOnBgColors } from '@/smb-skin/types/SmbOnBgColors';
import { type SmbThemeMode } from '@/smb-skin/types/SmbThemeMode';
import { clampNumber } from '@/smb-skin/utils/clampNumber';
import { getFrostedPanelLuminance } from '@/smb-skin/utils/getFrostedPanelLuminance';
import { mixHexColors } from '@/smb-skin/utils/mixHexColors';
import { pickSmbContrastText } from '@/smb-skin/utils/pickSmbContrastText';

const LIGHT_INK: SmbOnBgColors = {
  text: '#09090B',
  muted: '#52525B',
};

const DARK_INK: SmbOnBgColors = {
  text: '#FAFAFA',
  muted: '#A1A1AA',
};

const smoothstep = (edgeStart: number, edgeEnd: number, value: number) => {
  const progress = clampNumber(
    (value - edgeStart) / (edgeEnd - edgeStart),
    0,
    1,
  );

  return progress * progress * (3 - 2 * progress);
};

// Theme ink while panels are solid, drifting to wallpaper contrast as the glass opens up
export const pickSmbProgressiveGlassText = (
  mode: SmbThemeMode,
  wallpaperLuminance: number,
  panelOpacity: number,
): SmbOnBgColors & { shadow: string } => {
  const opacity = clampNumber(panelOpacity, 0, 1);
  // Wallpaper shows through text sooner than the fill opacity alone suggests
  const textBackgroundLuminance = getFrostedPanelLuminance(
    wallpaperLuminance,
    mode,
    opacity ** 1.65,
  );
  const target = pickSmbContrastText(textBackgroundLuminance);
  const ink = mode === 'light' ? LIGHT_INK : DARK_INK;
  const progress = smoothstep(0.12, 0.72, 1 - opacity);

  const text = mixHexColors(ink.text, target.text, progress);
  const muted = mixHexColors(ink.muted, target.text, progress * 0.92);

  const prefersLightText = target.text.toLowerCase() === '#ffffff';

  const shadow =
    progress < 0.08
      ? 'none'
      : prefersLightText
        ? `0 1px 2px rgba(0,0,0,${(0.2 + progress * 0.55).toFixed(3)}), 0 0 ${Math.round(6 + progress * 10)}px rgba(0,0,0,${(progress * 0.35).toFixed(3)})`
        : `0 1px 2px rgba(255,255,255,${(0.25 + progress * 0.45).toFixed(3)}), 0 0 ${Math.round(5 + progress * 8)}px rgba(255,255,255,${(progress * 0.28).toFixed(3)})`;

  return { text, muted, shadow };
};
