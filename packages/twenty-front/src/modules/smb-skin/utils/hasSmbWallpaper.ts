import { type SmbBackground } from '@/smb-skin/types/SmbBackground';
import { isNonEmptyString } from '@sniptt/guards';

export const hasSmbWallpaper = (background: SmbBackground) =>
  background.type === 'image' && isNonEmptyString(background.url);
