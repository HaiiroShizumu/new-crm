import { type SmbWallpaperSample } from '@/smb-skin/types/SmbWallpaperSample';
import { formatHexColor } from '@/smb-skin/utils/formatHexColor';
import { getRelativeLuminance } from '@/smb-skin/utils/getRelativeLuminance';
import { loadSmbWallpaperImage } from '@/smb-skin/utils/loadSmbWallpaperImage';
import { isDefined } from 'twenty-shared/utils';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 36;

const wallpaperSampleCache = new Map<string, SmbWallpaperSample>();

// Luminance is top-weighted because page titles sit near the top of the canvas
export const sampleSmbWallpaper = async (
  url: string,
): Promise<SmbWallpaperSample> => {
  const cachedSample = wallpaperSampleCache.get(url);

  if (isDefined(cachedSample)) {
    return cachedSample;
  }

  const image = await loadSmbWallpaperImage(url);
  const canvas = document.createElement('canvas');

  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!isDefined(context)) {
    throw new Error('Canvas unavailable');
  }

  context.drawImage(image, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  let luminanceSum = 0;
  let weightSum = 0;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;

  for (let row = 0; row < SAMPLE_HEIGHT; row++) {
    const rowWeight =
      row < SAMPLE_HEIGHT / 3 ? 2.2 : row < (2 * SAMPLE_HEIGHT) / 3 ? 1.2 : 0.7;

    for (let column = 0; column < SAMPLE_WIDTH; column++) {
      const index = (row * SAMPLE_WIDTH + column) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      luminanceSum += getRelativeLuminance(red, green, blue) * rowWeight;
      weightSum += rowWeight;
      redSum += red;
      greenSum += green;
      blueSum += blue;
    }
  }

  const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
  const sample: SmbWallpaperSample = {
    luminance: weightSum > 0 ? luminanceSum / weightSum : 0.5,
    averageColor: formatHexColor([
      redSum / pixelCount,
      greenSum / pixelCount,
      blueSum / pixelCount,
    ]),
  };

  wallpaperSampleCache.set(url, sample);

  return sample;
};
