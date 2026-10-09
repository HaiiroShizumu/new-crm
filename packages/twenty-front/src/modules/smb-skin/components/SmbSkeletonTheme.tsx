import { type ReactNode } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';

import { SMB_SKELETON_COLORS } from '@/smb-skin/constants/SmbSkeletonColors';

type SmbSkeletonThemeProps = {
  surface: keyof typeof SMB_SKELETON_COLORS;
  borderRadius: number;
  children: ReactNode;
};

export const SmbSkeletonTheme = ({
  surface,
  borderRadius,
  children,
}: SmbSkeletonThemeProps) => (
  <SkeletonTheme
    baseColor={SMB_SKELETON_COLORS[surface].baseColor}
    highlightColor={SMB_SKELETON_COLORS[surface].highlightColor}
    borderRadius={borderRadius}
  >
    {children}
  </SkeletonTheme>
);
