import { styled } from '@linaria/react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { themeCssVariables } from 'twenty-ui/theme';

import { NAVIGATION_DRAWER_COLLAPSED_WIDTH } from '@/ui/layout/resizable-panel/constants/NavigationDrawerCollapsedWidth';
import { navigationDrawerWidthState } from '@/ui/navigation/states/navigationDrawerWidthState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const COLLAPSED_ITEM_COUNT = 6;
// Matches the icon rail of TwoLevelNavigationRail
const ICON_RAIL_WIDTH = 80;

const EXPANDED_SECTIONS = [
  { hasTitle: false, itemLabelWidths: [88, 72, 104, 80] },
  { hasTitle: true, itemLabelWidths: [96, 64, 84] },
];

const StyledRow = styled.div`
  display: flex;
  height: 100%;
`;

const StyledIconRail = styled.div`
  align-items: center;
  border-right: 1px solid var(--smb-border-l1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  padding-top: ${themeCssVariables.spacing[4]};
  width: ${ICON_RAIL_WIDTH}px;
`;

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

type SmbRailSkeletonLoaderProps = {
  isExpanded: boolean;
  hasIconRail: boolean;
};

export const SmbRailSkeletonLoader = ({
  isExpanded,
  hasIconRail,
}: SmbRailSkeletonLoaderProps) => {
  const navigationDrawerWidth = useAtomStateValue(navigationDrawerWidthState);

  return (
    <SkeletonTheme borderRadius={8}>
      <StyledRow>
        {hasIconRail && (
          <StyledIconRail>
            {Array.from({ length: COLLAPSED_ITEM_COUNT }).map(
              (_, itemIndex) => (
                <Skeleton
                  key={itemIndex}
                  width={40}
                  height={40}
                  borderRadius={12}
                />
              ),
            )}
          </StyledIconRail>
        )}
        <StyledContainer
          width={
            isExpanded
              ? navigationDrawerWidth
              : NAVIGATION_DRAWER_COLLAPSED_WIDTH
          }
        >
          <StyledHeader isExpanded={isExpanded}>
            <Skeleton width={20} height={20} borderRadius={6} />
            {isExpanded && <Skeleton width={96} height={14} />}
          </StyledHeader>
          {isExpanded ? (
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
      </StyledRow>
    </SkeletonTheme>
  );
};
