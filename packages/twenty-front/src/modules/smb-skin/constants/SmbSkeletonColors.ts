// Translucent so skeletons sit on the wallpaper or glass without turning into
// opaque slabs; each set follows the text tier of the surface it is drawn on
export const SMB_SKELETON_COLORS = {
  canvas: {
    baseColor: 'color-mix(in srgb, var(--color-on-bg) 14%, transparent)',
    highlightColor: 'color-mix(in srgb, var(--color-on-bg) 24%, transparent)',
  },
  glass: {
    baseColor: 'color-mix(in srgb, var(--color-text) 10%, transparent)',
    highlightColor: 'color-mix(in srgb, var(--color-text) 18%, transparent)',
  },
} as const;
