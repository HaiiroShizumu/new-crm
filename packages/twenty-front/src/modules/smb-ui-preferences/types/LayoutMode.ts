export type LayoutMode =
  | 'sidebar-tabs'
  | 'linked-tabs'
  | 'inverted-tabs'
  | 'two-level'
  | 'sidebar-only'
  | 'tabs-only';

export const DEFAULT_LAYOUT_MODE: LayoutMode = 'linked-tabs';

export const LAYOUT_MODES: LayoutMode[] = [
  'linked-tabs',
  'inverted-tabs',
  'sidebar-tabs',
  'two-level',
  'sidebar-only',
  'tabs-only',
];

export const isLayoutMode = (value: unknown): value is LayoutMode =>
  typeof value === 'string' && (LAYOUT_MODES as string[]).includes(value);
