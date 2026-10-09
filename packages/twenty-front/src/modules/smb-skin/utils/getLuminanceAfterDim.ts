import { clampNumber } from '@/smb-skin/utils/clampNumber';

// Positive dim mixes toward black, negative toward white
export const getLuminanceAfterDim = (imageLuminance: number, dim: number) => {
  const clampedDim = clampNumber(dim, -1, 1);

  if (clampedDim >= 0) {
    return imageLuminance * (1 - clampedDim);
  }

  const lightenAmount = -clampedDim;

  return imageLuminance * (1 - lightenAmount) + lightenAmount;
};
