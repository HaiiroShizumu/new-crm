export const loadSmbWallpaperImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Wallpaper sample failed'));

    // Same-origin presets and data URLs never taint the canvas; remote URLs need CORS
    if (
      !url.startsWith('data:') &&
      !url.startsWith('blob:') &&
      !url.startsWith('/')
    ) {
      image.crossOrigin = 'anonymous';
    }

    image.src = url;
  });
