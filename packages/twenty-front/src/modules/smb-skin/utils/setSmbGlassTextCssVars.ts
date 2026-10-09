import { type SmbOnBgColors } from '@/smb-skin/types/SmbOnBgColors';

export const setSmbGlassTextCssVars = (
  root: HTMLElement,
  colors: SmbOnBgColors & { shadow?: string },
) => {
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-muted', colors.muted);
  root.style.setProperty('--chrome-text-shadow', colors.shadow ?? 'none');
};
