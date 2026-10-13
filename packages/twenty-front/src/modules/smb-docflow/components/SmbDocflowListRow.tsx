import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledRow = styled.button<{ isSelected: boolean }>`
  align-items: center;
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border: none;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDetail = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
`;

type SmbDocflowListRowProps = {
  title: string;
  detail?: ReactNode;
  isSelected: boolean;
  onClick: () => void;
};

export const SmbDocflowListRow = ({
  title,
  detail,
  isSelected,
  onClick,
}: SmbDocflowListRowProps) => (
  <StyledRow
    type="button"
    isSelected={isSelected}
    aria-pressed={isSelected}
    onClick={onClick}
  >
    <StyledTitle>{title}</StyledTitle>
    {detail !== undefined && <StyledDetail>{detail}</StyledDetail>}
  </StyledRow>
);
