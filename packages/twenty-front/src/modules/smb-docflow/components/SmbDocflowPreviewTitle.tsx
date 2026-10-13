import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type SmbDocflowPreviewTitleProps = {
  title: string;
  subtitle?: string;
};

export const SmbDocflowPreviewTitle = ({
  title,
  subtitle,
}: SmbDocflowPreviewTitleProps) => (
  <div>
    <StyledTitle>{title}</StyledTitle>
    {subtitle !== undefined && <StyledSubtitle>{subtitle}</StyledSubtitle>}
  </div>
);
