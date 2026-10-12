import { styled } from '@linaria/react';
import Skeleton from 'react-loading-skeleton';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbSkeletonTheme } from '@/smb-skin/components/SmbSkeletonTheme';
import { APP_HEADER_HEIGHT } from '@/ui/layout/constants/AppHeaderHeight';

const PILL_TAB_WIDTHS = [96, 196, 116, 88];

const StyledContainer = styled.div`
  align-items: center;
  box-sizing: border-box;
  column-gap: ${themeCssVariables.spacing[3]};
  display: grid;
  flex-shrink: 0;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  height: ${APP_HEADER_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledPillTabs = styled.div`
  backdrop-filter: blur(var(--smb-blur-l2));
  background: var(--smb-surface-l1);
  border: 1px solid var(--smb-border-l1);
  border-radius: 999px;
  box-shadow: var(--smb-shadow-l1);
  display: inline-flex;
  gap: 2px;
  grid-column: 2;
  isolation: isolate;
  padding: 3px;
`;

const StyledEnd = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
  grid-column: 3;
  justify-self: end;
`;

const StyledCircleSkeleton = styled(Skeleton)`
  corner-shape: round;
`;

const StyledAvatar = styled.div`
  display: flex;
  margin-left: 4px;
  padding: ${themeCssVariables.spacing['0.5']};
`;

export const SmbTopBarSkeletonLoader = () => (
  <StyledContainer data-smb-top-bar>
    <StyledPillTabs>
      <SmbSkeletonTheme surface="glass" borderRadius={999}>
        {PILL_TAB_WIDTHS.map((pillTabWidth, pillTabIndex) => (
          <Skeleton key={pillTabIndex} width={pillTabWidth} height={32} />
        ))}
      </SmbSkeletonTheme>
    </StyledPillTabs>
    <SmbSkeletonTheme surface="canvas" borderRadius={6}>
      <StyledEnd>
        <Skeleton width={20} height={20} />
        <Skeleton width={44} height={18} />
        <StyledAvatar>
          <StyledCircleSkeleton borderRadius="50%" width={40} height={40} />
        </StyledAvatar>
      </StyledEnd>
    </SmbSkeletonTheme>
  </StyledContainer>
);
