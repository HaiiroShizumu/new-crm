import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';
import { isSmbDocflowTaskOverdue } from '@/smb-docflow/utils/isSmbDocflowTaskOverdue';
import { formatDate } from '~/utils/date-utils';

const StyledCard = styled.button<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.light
      : themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 240px;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledTitle = styled.span`
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledProcessName = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledFooter = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledOverdue = styled.span`
  color: ${themeCssVariables.font.color.danger};
`;

type SmbDocflowTaskCardProps = {
  task: SmbDocflowTask;
  isSelected: boolean;
  onClick: () => void;
};

export const SmbDocflowTaskCard = ({
  task,
  isSelected,
  onClick,
}: SmbDocflowTaskCardProps) => {
  const { t } = useLingui();
  const isOverdue = isSmbDocflowTaskOverdue(task, new Date());

  return (
    <StyledCard
      type="button"
      isSelected={isSelected}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      <StyledTitle>{task.title}</StyledTitle>
      <StyledProcessName>{task.workflowRunName}</StyledProcessName>
      {isDefined(task.dueAt) && (
        <StyledFooter>
          <span>{formatDate(task.dueAt, 'dd.MM.yyyy')}</span>
          {isOverdue && <StyledOverdue>{t`Просрочено`}</StyledOverdue>}
        </StyledFooter>
      )}
    </StyledCard>
  );
};
