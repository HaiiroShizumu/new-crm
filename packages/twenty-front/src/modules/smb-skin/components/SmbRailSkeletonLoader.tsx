import { styled } from '@linaria/react';
import Skeleton from 'react-loading-skeleton';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbSkeletonTheme } from '@/smb-skin/components/SmbSkeletonTheme';
import { NAVIGATION_DRAWER_COLLAPSED_WIDTH } from '@/ui/layout/resizable-panel/constants/NavigationDrawerCollapsedWidth';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { navigationDrawerWidthState } from '@/ui/navigation/states/navigationDrawerWidthState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const COLLAPSED_ITEM_COUNT = 6;

const EXPANDED_SECTIONS = [
  { hasTitle: false, itemLabelWidths: [88, 72, 104, 80] },
  { hasTitle: true, itemLabelWidths: [96, 64, 84] },
];

const StyledContainer = styled.div<{ width: number }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: ${({ width }) => `${width}px`};
`;

const StyledHeader = styled.div<{ isExpanded: boolean }>`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  height: 48px;
  justify-content: ${({ isExpanded }) =>
    isExpanded ? 'flex-start' : 'center'};
  padding: ${({ isExpanded }) =>
    isExpanded ? `0 ${themeCssVariables.spacing[3]}` : '0'};
`;

const StyledCollapsedItems = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[2]} 0;
`;

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledSectionTitle = styled.div`
  padding: 0 ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[1]};
`;

const StyledItem = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

export const SmbRailSkeletonLoader = () => {
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  const navigationDrawerWidth = useAtomStateValue(navigationDrawerWidthState);

  return (
    <SmbSkeletonTheme surface="glass" borderRadius={8}>
      <StyledContainer
        width={
          isNavigationDrawerExpanded
            ? navigationDrawerWidth
            : NAVIGATION_DRAWER_COLLAPSED_WIDTH
        }
      >
        <StyledHeader isExpanded={isNavigationDrawerExpanded}>
          <Skeleton width={20} height={20} borderRadius={6} />
          {isNavigationDrawerExpanded && <Skeleton width={96} height={14} />}
        </StyledHeader>
        {isNavigationDrawerExpanded ? (
          <StyledSections>
            {EXPANDED_SECTIONS.map(
              ({ hasTitle, itemLabelWidths }, sectionIndex) => (
                <StyledSection key={sectionIndex}>
                  {hasTitle && (
                    <StyledSectionTitle>
                      <Skeleton width={56} height={10} />
                    </StyledSectionTitle>
                  )}
                  {itemLabelWidths.map((itemLabelWidth, itemIndex) => (
                    <StyledItem key={itemIndex}>
                      <Skeleton width={16} height={16} borderRadius={5} />
                      <Skeleton width={itemLabelWidth} height={12} />
                    </StyledItem>
                  ))}
                </StyledSection>
              ),
            )}
          </StyledSections>
        ) : (
          <StyledCollapsedItems>
            {Array.from({ length: COLLAPSED_ITEM_COUNT }).map(
              (_, itemIndex) => (
                <Skeleton
                  key={itemIndex}
                  width={30}
                  height={30}
                  borderRadius={10}
                />
              ),
            )}
          </StyledCollapsedItems>
        )}
      </StyledContainer>
    </SmbSkeletonTheme>
  );
};
