import { useLayoutEffect } from 'react';

import { smbAccentState } from '@/smb-skin/states/smbAccentState';
import { smbBackgroundState } from '@/smb-skin/states/smbBackgroundState';
import { smbPanelFramesState } from '@/smb-skin/states/smbPanelFramesState';
import { smbPanelOpacityState } from '@/smb-skin/states/smbPanelOpacityState';
import { smbSidebarModeState } from '@/smb-skin/states/smbSidebarModeState';
import { smbSidebarOpenState } from '@/smb-skin/states/smbSidebarOpenState';
import { type SmbThemeMode } from '@/smb-skin/types/SmbThemeMode';
import { applySmbThemeVars } from '@/smb-skin/utils/applySmbThemeVars';
import { getEffectiveSmbPanelOpacity } from '@/smb-skin/utils/getEffectiveSmbPanelOpacity';
import { getLuminanceAfterDim } from '@/smb-skin/utils/getLuminanceAfterDim';
import { getRelativeLuminance } from '@/smb-skin/utils/getRelativeLuminance';
import { hasSmbWallpaper } from '@/smb-skin/utils/hasSmbWallpaper';
import { pickSmbOnBgColors } from '@/smb-skin/utils/pickSmbOnBgColors';
import { pickSmbProgressiveGlassText } from '@/smb-skin/utils/pickSmbProgressiveGlassText';
import { sampleSmbWallpaper } from '@/smb-skin/utils/sampleSmbWallpaper';
import { setSmbGlassTextCssVars } from '@/smb-skin/utils/setSmbGlassTextCssVars';
import { setSmbOnBgCssVars } from '@/smb-skin/utils/setSmbOnBgCssVars';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type SmbSkinProviderEffectProps = {
  mode: SmbThemeMode;
};

// Solid canvas luminance when there is no wallpaper to sample
const SMB_CANVAS_LUMINANCE = {
  light: getRelativeLuminance(244, 244, 245),
  dark: getRelativeLuminance(18, 18, 18),
} as const;

export const SmbSkinProviderEffect = ({ mode }: SmbSkinProviderEffectProps) => {
  const smbAccent = useAtomStateValue(smbAccentState);
  const smbBackground = useAtomStateValue(smbBackgroundState);
  const smbPanelOpacity = useAtomStateValue(smbPanelOpacityState);
  const smbPanelFrames = useAtomStateValue(smbPanelFramesState);
  const smbSidebarMode = useAtomStateValue(smbSidebarModeState);
  const smbSidebarOpen = useAtomStateValue(smbSidebarOpenState);

  // Layout effect so the skin attributes land before the parent ThemeProvider
  // snapshots computed CSS variables into its JS theme on mount
  useLayoutEffect(() => {
    const root = document.documentElement;

    applySmbThemeVars({
      root,
      mode,
      accent: smbAccent,
      background: smbBackground,
      panelOpacity: smbPanelOpacity,
    });

    const effectivePanelOpacity = getEffectiveSmbPanelOpacity(
      mode,
      smbPanelOpacity,
    );

    if (!hasSmbWallpaper(smbBackground) || smbBackground.url === null) {
      setSmbGlassTextCssVars(
        root,
        pickSmbProgressiveGlassText(
          mode,
          SMB_CANVAS_LUMINANCE[mode],
          effectivePanelOpacity,
        ),
      );

      return;
    }

    const wallpaperUrl = smbBackground.url;
    let cancelled = false;

    const sampleWallpaper = async () => {
      try {
        const wallpaperSample = await sampleSmbWallpaper(wallpaperUrl);

        if (cancelled) {
          return;
        }

        const wallpaperLuminance = getLuminanceAfterDim(
          wallpaperSample.luminance,
          smbBackground.dim,
        );

        setSmbOnBgCssVars(root, pickSmbOnBgColors(wallpaperLuminance));
        setSmbGlassTextCssVars(
          root,
          pickSmbProgressiveGlassText(
            mode,
            wallpaperLuminance,
            effectivePanelOpacity,
          ),
        );
        root.style.setProperty(
          '--smb-wallpaper-average',
          wallpaperSample.averageColor,
        );
      } catch {
        // Palette defaults from smb-skin.css stay in place
      }
    };

    void sampleWallpaper();

    return () => {
      cancelled = true;
    };
  }, [mode, smbAccent, smbBackground, smbPanelOpacity]);

  useLayoutEffect(() => {
    const root = document.documentElement;

    root.dataset.frames = smbPanelFrames ? 'true' : 'false';
    root.dataset.sidebarMode = smbSidebarMode;
    root.dataset.sidebarOpen = smbSidebarOpen ? 'true' : 'false';
  }, [smbPanelFrames, smbSidebarMode, smbSidebarOpen]);

  return <></>;
};
