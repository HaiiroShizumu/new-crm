/* oxlint-disable twenty/no-hardcoded-colors */
import { type SmbOnBgColors } from '@/smb-skin/types/SmbOnBgColors';
import { getContrastRatio } from '@/smb-skin/utils/getContrastRatio';
import { getRelativeLuminance } from '@/smb-skin/utils/getRelativeLuminance';

const WHITE_TEXT_LUMINANCE = getRelativeLuminance(255, 255, 255);
const DARK_TEXT_LUMINANCE = getRelativeLuminance(9, 9, 11);

const LIGHT_GLASS_TEXT: SmbOnBgColors = {
  text: '#FFFFFF',
  muted: '#F4F4F5',
};

const DARK_GLASS_TEXT: SmbOnBgColors = {
  text: '#09090B',
  muted: '#18181B',
};

export const pickSmbContrastText = (backgroundLuminance: number) => {
  const whiteContrast = getContrastRatio(
    WHITE_TEXT_LUMINANCE,
    backgroundLuminance,
  );
  const darkContrast = getContrastRatio(
    DARK_TEXT_LUMINANCE,
    backgroundLuminance,
  );

  return whiteContrast >= darkContrast ? LIGHT_GLASS_TEXT : DARK_GLASS_TEXT;
};
