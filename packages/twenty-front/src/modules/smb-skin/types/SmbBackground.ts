export type SmbBackground = {
  type: 'none' | 'image';
  url: string | null;
  // Signed veil: -1 white (lighten), 0 none, +1 black (darken)
  dim: number;
  blur: number;
};
