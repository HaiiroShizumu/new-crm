import { styled } from '@linaria/react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { themeCssVariables } from 'twenty-ui/theme';

import { APP_HEADER_HEIGHT } from '@/ui/layout/constants/AppHeaderHeight';

const MODE_TAB_WIDTHS = [88, 104];
const WORKSPACE_TAB_WIDTHS = [96, 132, 116, 88];

const StyledContainer = styled.div`
  align-items: center;
  box-sizing: border-box;
  column-gap: ${themeCssVariables.spacing[3]};
  display: grid;
  flex-shrink: 0;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  min-height: ${APP_HEADER_HEIGHT}px;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

const StyledCenter = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: 2;
`;

const StyledPillTabs = styled.div`
  backdrop-filter: blur(var(--smb-blur-l2));
  background: var(--smb-surface-l1);
  border: 1px solid var(--smb-border-l1);
  border-radius: 999px;
  box-shadow: var(--smb-shadow-l1);
  display: inline-flex;
  gap: 2px;
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

type SmbTopBarSkeletonLoaderProps = {
  hasModeTabs: boolean;
  hasWorkspaceTabs: boolean;
};

export const SmbTopBarSkeletonLoader = ({
  hasModeTabs,
  hasWorkspaceTabs,
}: SmbTopBarSkeletonLoaderProps) => {
  const pillTabRows = [
    ...(hasModeTabs ? [MODE_TAB_WIDTHS] : []),
    ...(hasWorkspaceTabs ? [WORKSPACE_TAB_WIDTHS] : []),
  ];

  return (
    <StyledContainer data-smb-top-bar>
      <StyledCenter>
        {pillTabRows.map((pillTabWidths, rowIndex) => (
          <StyledPillTabs key={rowIndex}>
            <SkeletonTheme borderRadius={999}>
              {pillTabWidths.map((pillTabWidth, pillTabIndex) => (
                <Skeleton key={pillTabIndex} width={pillTabWidth} height={28} />
              ))}
            </SkeletonTheme>
          </StyledPillTabs>
        ))}
      </StyledCenter>
      <SkeletonTheme borderRadius={6}>
        <StyledEnd>
          <Skeleton width={20} height={20} />
          <Skeleton width={20} height={20} />
          <Skeleton width={44} height={18} />
          <StyledAvatar>
            <StyledCircleSkeleton borderRadius="50%" width={24} height={24} />
          </StyledAvatar>
        </StyledEnd>
      </SkeletonTheme>
    </StyledContainer>
  );
};
