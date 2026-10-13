import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

const SKELETON_ROW_COUNT = 5;

const StyledSkeletonList = styled.div`
  display: flex;
  flex-direction: column;
`;

// Те же отступы и граница, что у строки списка, чтобы после загрузки
// содержимое не подпрыгивало.
const StyledSkeletonRow = styled.div`
  background: ${themeCssVariables.background.tertiary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  font-size: ${themeCssVariables.font.size.md};
  overflow: hidden;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

// Неразрывный пробел даёт строке высоту строки текста: без содержимого
// div схлопнулся бы до одних отступов и скелетон был бы ниже списка.
export const SmbDocflowListSkeleton = () => (
  <StyledSkeletonList aria-hidden="true">
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <StyledSkeletonRow key={index}>{'\u00A0'}</StyledSkeletonRow>
    ))}
  </StyledSkeletonList>
);
