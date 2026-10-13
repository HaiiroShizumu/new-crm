import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowListSkeleton } from '@/smb-docflow/components/SmbDocflowListSkeleton';
import { SmbDocflowSplitLayout } from '@/smb-docflow/components/SmbDocflowSplitLayout';
import { SmbDocflowTaskCard } from '@/smb-docflow/components/SmbDocflowTaskCard';
import { SmbDocflowTaskPreview } from '@/smb-docflow/components/SmbDocflowTaskPreview';
import { useSmbDocflowTasks } from '@/smb-docflow/hooks/useSmbDocflowTasks';
import { isSmbDocflowTaskOverdue } from '@/smb-docflow/utils/isSmbDocflowTaskOverdue';
import { sortSmbDocflowTasks } from '@/smb-docflow/utils/sortSmbDocflowTasks';
import { formatDate } from '~/utils/date-utils';

type SmbDocflowAssigneeRecord = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
};

const WORKSPACE_MEMBERS_LIMIT = 500;

const buildAssigneeName = (name: SmbDocflowAssigneeRecord['name']): string =>
  [name?.firstName, name?.lastName]
    .filter((part) => isDefined(part) && part !== '')
    .join(' ');

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[2]};
`;

const StyledOverdue = styled.span`
  color: ${themeCssVariables.font.color.danger};
`;

// Карточки одного раздела идут в один ряд, длинный список прокручивается вбок.
const StyledCardRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  overflow-x: auto;
  padding: 0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[3]};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const StyledTableHeader = styled.th`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  text-align: left;
`;

const StyledTableRow = styled.tr<{ isSelected: boolean }>`
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  cursor: pointer;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledTableCell = styled.td`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledMutedCell = styled(StyledTableCell)`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const SmbDocflowTasksTab = () => {
  const { t } = useLingui();
  const { tasks, loading } = useSmbDocflowTasks();
  const { records: workspaceMembers } = useFindManyRecords<
    SmbDocflowAssigneeRecord & { __typename?: string }
  >({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    limit: WORKSPACE_MEMBERS_LIMIT,
    recordGqlFields: { id: true, name: true },
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  if (loading) {
    return <SmbDocflowListSkeleton />;
  }

  if (tasks.length === 0) {
    return <SmbDocflowEmptyState message={t`Заданий нет.`} />;
  }

  const now = new Date();
  const myTasks = tasks.filter((task) => task.isMine);
  const otherTasks = sortSmbDocflowTasks(tasks.filter((task) => !task.isMine));
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const assigneeNamesById = new Map(
    workspaceMembers.map((workspaceMember) => [
      workspaceMember.id,
      buildAssigneeName(workspaceMember.name),
    ]),
  );

  return (
    <SmbDocflowSplitLayout
      onClose={() => setSelectedTaskId(undefined)}
      preview={
        isDefined(selectedTask) ? (
          // Keyed by task so the answers typed for one task never leak into another.
          <SmbDocflowTaskPreview
            key={selectedTask.id}
            task={selectedTask}
            onAnswered={() => setSelectedTaskId(undefined)}
          />
        ) : undefined
      }
    >
      {myTasks.length > 0 && (
        <section key="my-tasks" aria-label={t`Ждут вас`}>
          <StyledSectionTitle>{t`Ждут вас`}</StyledSectionTitle>
          <StyledCardRow>
            {myTasks.map((task) => (
              <SmbDocflowTaskCard
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onClick={() => setSelectedTaskId(task.id)}
              />
            ))}
          </StyledCardRow>
        </section>
      )}
      {otherTasks.length > 0 && (
        <section key="other-tasks" aria-label={t`Остальные задания`}>
          <StyledSectionTitle>{t`Остальные задания`}</StyledSectionTitle>
          <StyledTable>
            <thead>
              <tr>
                <StyledTableHeader scope="col">{t`Задание`}</StyledTableHeader>
                <StyledTableHeader scope="col">{t`Процесс`}</StyledTableHeader>
                <StyledTableHeader scope="col">
                  {t`Исполнитель`}
                </StyledTableHeader>
                <StyledTableHeader scope="col">{t`Срок`}</StyledTableHeader>
                <StyledTableHeader scope="col">{t`Создано`}</StyledTableHeader>
              </tr>
            </thead>
            <tbody>
              {otherTasks.map((task) => {
                const assigneeName = isDefined(task.assigneeWorkspaceMemberId)
                  ? assigneeNamesById.get(task.assigneeWorkspaceMemberId)
                  : undefined;
                const isOverdue = isSmbDocflowTaskOverdue(task, now);

                return (
                  <StyledTableRow
                    key={task.id}
                    isSelected={task.id === selectedTaskId}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <StyledTableCell>{task.title}</StyledTableCell>
                    <StyledTableCell>{task.workflowRunName}</StyledTableCell>
                    <StyledTableCell>
                      {assigneeName ? assigneeName : '—'}
                    </StyledTableCell>
                    <StyledTableCell>
                      {isDefined(task.dueAt) &&
                        formatDate(task.dueAt, 'dd.MM.yyyy')}
                      {isOverdue && (
                        <>
                          {' '}
                          <StyledOverdue>{t`Просрочено`}</StyledOverdue>
                        </>
                      )}
                    </StyledTableCell>
                    <StyledMutedCell>
                      {formatDate(task.createdAt, 'dd.MM.yyyy HH:mm')}
                    </StyledMutedCell>
                  </StyledTableRow>
                );
              })}
            </tbody>
          </StyledTable>
        </section>
      )}
    </SmbDocflowSplitLayout>
  );
};
