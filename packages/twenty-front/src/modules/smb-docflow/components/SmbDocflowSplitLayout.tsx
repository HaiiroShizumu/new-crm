import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledSplit = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const StyledMain = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
`;

const StyledPreview = styled.aside`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[3]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
  width: 360px;
`;

type SmbDocflowSplitLayoutProps = {
  children: ReactNode;
  preview?: ReactNode;
};

// A list on the left and what is selected in it on the right: the shape all
// three docflow tabs share.
export const SmbDocflowSplitLayout = ({
  children,
  preview,
}: SmbDocflowSplitLayoutProps) => (
  <StyledSplit>
    <StyledMain>{children}</StyledMain>
    {preview !== undefined && preview !== null && (
      <StyledPreview>{preview}</StyledPreview>
    )}
  </StyledSplit>
);
