import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowListRow } from '@/smb-docflow/components/SmbDocflowListRow';
import { SmbDocflowSplitLayout } from '@/smb-docflow/components/SmbDocflowSplitLayout';
import { SmbDocflowTaskPreview } from '@/smb-docflow/components/SmbDocflowTaskPreview';
import { useSmbDocflowTasks } from '@/smb-docflow/hooks/useSmbDocflowTasks';
import { isSmbDocflowTaskOverdue } from '@/smb-docflow/utils/isSmbDocflowTaskOverdue';

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

export const SmbDocflowTasksTab = () => {
  const { t } = useLingui();
  const { tasks, loading } = useSmbDocflowTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  if (!loading && tasks.length === 0) {
    return <SmbDocflowEmptyState message={t`Заданий нет.`} />;
  }

  const now = new Date();
  const myTasks = tasks.filter((task) => task.isMine);
  const otherTasks = tasks.filter((task) => !task.isMine);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  const sections = [
    { title: t`Ждут вас`, sectionTasks: myTasks },
    { title: t`Остальные задания`, sectionTasks: otherTasks },
  ].filter(({ sectionTasks }) => sectionTasks.length > 0);

  return (
    <SmbDocflowSplitLayout
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
      {sections.map(({ title, sectionTasks }) => (
        <section key={title} aria-label={title}>
          <StyledSectionTitle>{title}</StyledSectionTitle>
          {sectionTasks.map((task) => (
            <SmbDocflowListRow
              key={task.id}
              title={task.title}
              detail={
                isSmbDocflowTaskOverdue(task, now) ? (
                  <StyledOverdue>{t`Просрочено`}</StyledOverdue>
                ) : (
                  task.workflowRunName
                )
              }
              isSelected={task.id === selectedTaskId}
              onClick={() => setSelectedTaskId(task.id)}
            />
          ))}
        </section>
      ))}
    </SmbDocflowSplitLayout>
  );
};
