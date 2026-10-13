import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  justify-content: center;
  padding: ${themeCssVariables.spacing[8]};
  text-align: center;
`;

type SmbDocflowEmptyStateProps = {
  message: string;
};

export const SmbDocflowEmptyState = ({
  message,
}: SmbDocflowEmptyStateProps) => <StyledEmptyState>{message}</StyledEmptyState>;
