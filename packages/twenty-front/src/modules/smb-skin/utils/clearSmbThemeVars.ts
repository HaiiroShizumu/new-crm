import { SMB_ROOT_CSS_VARIABLES } from '@/smb-skin/constants/SmbRootCssVariables';

export const clearSmbThemeVars = (root: HTMLElement) => {
  for (const cssVariable of SMB_ROOT_CSS_VARIABLES) {
    root.style.removeProperty(cssVariable);
  }

  delete root.dataset.skin;
  delete root.dataset.theme;
  delete root.dataset.wallpaper;
};
