import { type SmbBackground } from '@/smb-skin/types/SmbBackground';
import { type SmbThemeMode } from '@/smb-skin/types/SmbThemeMode';
import { clampNumber } from '@/smb-skin/utils/clampNumber';
import { clearSmbThemeVars } from '@/smb-skin/utils/clearSmbThemeVars';
import { getEffectiveSmbPanelOpacity } from '@/smb-skin/utils/getEffectiveSmbPanelOpacity';
import { hasSmbWallpaper } from '@/smb-skin/utils/hasSmbWallpaper';

type ApplySmbThemeVarsParams = {
  root: HTMLElement;
  mode: SmbThemeMode;
  accent: string;
  background: SmbBackground;
  panelOpacity: number;
};

// The static light/dark palette lives in smb-skin.css; only user-driven values are written inline.
export const applySmbThemeVars = ({
  root,
  mode,
  accent,
  background,
  panelOpacity,
}: ApplySmbThemeVarsParams) => {
  const hasWallpaper = hasSmbWallpaper(background);
  const dim = hasWallpaper ? clampNumber(background.dim, -1, 1) : 0;

  clearSmbThemeVars(root);

  root.dataset.skin = 'smb';
  root.dataset.theme = mode;
  root.dataset.wallpaper = hasWallpaper ? 'true' : 'false';

  root.style.setProperty('--color-accent', accent);
  root.style.setProperty(
    '--panel-opacity',
    String(getEffectiveSmbPanelOpacity(mode, panelOpacity)),
  );
  root.style.setProperty(
    '--app-bg-image',
    hasWallpaper ? `url("${background.url}")` : 'none',
  );
  root.style.setProperty('--app-bg-dim', String(Math.abs(dim)));
  root.style.setProperty(
    '--app-bg-dim-rgb',
    dim >= 0 ? '0 0 0' : '255 255 255',
  );
  root.style.setProperty('--app-bg-blur', `${background.blur}px`);
};
