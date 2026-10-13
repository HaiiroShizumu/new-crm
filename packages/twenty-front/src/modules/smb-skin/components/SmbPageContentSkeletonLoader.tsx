import { styled } from '@linaria/react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { themeCssVariables } from 'twenty-ui/theme';

import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';

const COLUMN_WIDTHS = [150, 110, 96, 120, 104, 88];

const ROW_CELL_WIDTH_RATIOS = [
  [0.7, 0.9, 0.6, 0.8, 0.5, 0.7],
  [0.55, 0.75, 0.7, 0.6, 0.8, 0.5],
  [0.8, 0.6, 0.5, 0.9, 0.6, 0.65],
  [0.6, 0.85, 0.65, 0.7, 0.55, 0.8],
  [0.75, 0.7, 0.55, 0.65, 0.7, 0.6],
];

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledViewBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  min-height: ${themeCssVariables.spacing[10]};
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledViewBarActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledTable = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  gap: ${themeCssVariables.spacing[6]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledCircleSkeleton = styled(Skeleton)`
  corner-shape: round;
`;

const StyledCell = styled.div<{ width: number }>`
  flex-shrink: 0;
  width: ${({ width }) => `${width}px`};
`;

export const SmbPageContentSkeletonLoader = () => (
  <PageCardLayout
    header={
      <SkeletonTheme borderRadius={8}>
        <PageCardHeader
          title={<Skeleton width={160} height={22} />}
          actionButton={
            <StyledActions>
              <Skeleton width={84} height={26} />
              <Skeleton width={24} height={24} />
            </StyledActions>
          }
        />
      </SkeletonTheme>
    }
    showInformationBanner={false}
  >
    <SkeletonTheme borderRadius={6}>
      <StyledViewBar>
        <Skeleton width={128} height={14} />
        <StyledViewBarActions>
          <Skeleton width={36} height={12} />
          <Skeleton width={28} height={12} />
          <Skeleton width={48} height={12} />
          <Skeleton width={84} height={24} />
          <Skeleton width={24} height={24} />
        </StyledViewBarActions>
      </StyledViewBar>
      <StyledTable>
        <StyledRow>
          <StyledCircleSkeleton borderRadius="50%" width={14} height={14} />
          {COLUMN_WIDTHS.map((columnWidth, columnIndex) => (
            <StyledCell key={columnIndex} width={columnWidth}>
              <Skeleton width={columnWidth * 0.55} height={10} />
            </StyledCell>
          ))}
        </StyledRow>
        {ROW_CELL_WIDTH_RATIOS.map((cellWidthRatios, rowIndex) => (
          <StyledRow key={rowIndex}>
            <StyledCircleSkeleton borderRadius="50%" width={14} height={14} />
            {COLUMN_WIDTHS.map((columnWidth, columnIndex) => (
              <StyledCell key={columnIndex} width={columnWidth}>
                <Skeleton
                  width={columnWidth * cellWidthRatios[columnIndex]}
                  height={14}
                />
              </StyledCell>
            ))}
          </StyledRow>
        ))}
      </StyledTable>
    </SkeletonTheme>
  </PageCardLayout>
);
