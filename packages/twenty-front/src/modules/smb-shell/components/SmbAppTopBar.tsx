import { styled } from '@linaria/react';

import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { SmbTopBarContent } from '@/smb-skin/components/SmbTopBarContent';
import { APP_HEADER_HEIGHT } from '@/ui/layout/constants/AppHeaderHeight';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div<{ isTall?: boolean }>`
  align-items: center;
  box-sizing: border-box;
  column-gap: ${themeCssVariables.spacing[3]};
  display: grid;
  flex-shrink: 0;
  grid-template-columns: minmax(0, 1fr) minmax(0, 480px) minmax(0, 1fr);
  height: ${({ isTall }) => (isTall ? 'auto' : `${APP_HEADER_HEIGHT}px`)};
  min-height: ${APP_HEADER_HEIGHT}px;
  padding: ${({ isTall }) =>
    isTall
      ? `${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]}`
      : `0 ${themeCssVariables.spacing[3]}`};
  user-select: none;

  @media print {
    display: none;
  }
`;

export const AppTopBar = () => {
  const { showTopModeTabs, showTopWorkspaceTabs } = useNavigationChromeLayout();
  // tabs-only stacks mode + workspace pills; grow past the single-row header
  const isTallHeader = showTopModeTabs && showTopWorkspaceTabs;

  return (
    <StyledContainer data-smb-top-bar isTall={isTallHeader}>
      <SmbTopBarContent />
    </StyledContainer>
  );
};
