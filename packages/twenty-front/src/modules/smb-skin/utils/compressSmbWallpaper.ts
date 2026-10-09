import { SMB_MAX_WALLPAPER_UPLOAD_BYTES } from '@/smb-skin/constants/SmbMaxWallpaperUploadBytes';
import { t } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

// Leaves localStorage room for the other preferences
const MAX_STORED_DATA_URL_LENGTH = 1_400_000;

const MAX_EDGE_PIXELS = 2560;

const JPEG_QUALITIES = [0.88, 0.78, 0.68, 0.58, 0.48, 0.38, 0.28];

const loadImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(t`Could not read the image.`));
    };
    image.src = objectUrl;
  });

const drawToCanvas = (
  source: CanvasImageSource,
  width: number,
  height: number,
) => {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!isDefined(context)) {
    throw new Error(t`Canvas is unavailable.`);
  }

  context.drawImage(source, 0, 0, width, height);

  return canvas;
};

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!isDefined(blob)) {
          reject(new Error(t`Could not compress the image.`));

          return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error(t`Could not read the compressed file.`));
        reader.readAsDataURL(blob);
      },
      'image/jpeg',
      quality,
    );
  });

// Downscales and JPEG-compresses until the data URL fits in localStorage
export const compressSmbWallpaper = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error(t`An image file is required.`);
  }

  if (file.size > SMB_MAX_WALLPAPER_UPLOAD_BYTES) {
    throw new Error(t`The file is too large (max 50 MB).`);
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    MAX_EDGE_PIXELS / Math.max(image.naturalWidth, image.naturalHeight),
  );
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));

  for (let pass = 0; pass < 4; pass++) {
    const canvas = drawToCanvas(image, width, height);

    for (const quality of JPEG_QUALITIES) {
      const dataUrl = await canvasToDataUrl(canvas, quality);

      if (dataUrl.length <= MAX_STORED_DATA_URL_LENGTH) {
        return dataUrl;
      }
    }

    width = Math.max(1, Math.round(width * 0.75));
    height = Math.max(1, Math.round(height * 0.75));
  }

  throw new Error(
    t`Could not compress the wallpaper to a size that can be saved.`,
  );
};
