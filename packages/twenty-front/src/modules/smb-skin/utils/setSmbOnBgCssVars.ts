import { type SmbOnBgColors } from '@/smb-skin/types/SmbOnBgColors';

export const setSmbOnBgCssVars = (root: HTMLElement, colors: SmbOnBgColors) => {
  root.style.setProperty('--color-on-bg', colors.text);
  root.style.setProperty('--color-on-bg-muted', colors.muted);
};
