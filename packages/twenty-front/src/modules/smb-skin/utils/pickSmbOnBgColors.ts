/* oxlint-disable twenty/no-hardcoded-colors */
import { type SmbOnBgColors } from '@/smb-skin/types/SmbOnBgColors';
import { getContrastRatio } from '@/smb-skin/utils/getContrastRatio';
import { getRelativeLuminance } from '@/smb-skin/utils/getRelativeLuminance';

const WHITE_TEXT_LUMINANCE = getRelativeLuminance(255, 255, 255);
const DARK_TEXT_LUMINANCE = getRelativeLuminance(9, 9, 11);

// White wins for on-canvas titles unless its contrast clearly fails
const WHITE_MIN_CONTRAST = 1.85;

const LIGHT_ON_BG: SmbOnBgColors = {
  text: 'rgba(255, 255, 255, 0.78)',
  muted: 'rgba(255, 255, 255, 0.55)',
};

const DARK_ON_BG: SmbOnBgColors = {
  text: 'rgba(9, 9, 11, 0.78)',
  muted: 'rgba(9, 9, 11, 0.52)',
};

export const pickSmbOnBgColors = (backgroundLuminance: number) => {
  const whiteContrast = getContrastRatio(
    WHITE_TEXT_LUMINANCE,
    backgroundLuminance,
  );
  const darkContrast = getContrastRatio(
    DARK_TEXT_LUMINANCE,
    backgroundLuminance,
  );

  if (
    whiteContrast < WHITE_MIN_CONTRAST &&
    darkContrast > whiteContrast * 1.35
  ) {
    return DARK_ON_BG;
  }

  return LIGHT_ON_BG;
};
