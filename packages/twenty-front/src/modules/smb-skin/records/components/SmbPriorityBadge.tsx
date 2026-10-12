import { styled } from '@linaria/react';
import { type ThemeColor, themeCssVariables } from 'twenty-ui/theme';

const StyledPriorityBadge = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: 600;
  gap: ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

const StyledPriorityDot = styled.span`
  border-radius: 50%;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
`;

type SmbPriorityBadgeProps = {
  label: string;
  color: ThemeColor;
};

export const SmbPriorityBadge = ({ label, color }: SmbPriorityBadgeProps) => (
  <StyledPriorityBadge>
    <StyledPriorityDot
      style={{ backgroundColor: themeCssVariables.color[color] }}
    />
    {label}
  </StyledPriorityBadge>
);
