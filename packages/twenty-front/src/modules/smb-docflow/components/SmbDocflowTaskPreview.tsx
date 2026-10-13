import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowForm } from '@/smb-docflow/components/SmbDocflowForm';
import { SmbDocflowPreviewTitle } from '@/smb-docflow/components/SmbDocflowPreviewTitle';
import { useAnswerSmbDocflowForm } from '@/smb-docflow/hooks/useAnswerSmbDocflowForm';
import { useSmbDocflowRunState } from '@/smb-docflow/hooks/useSmbDocflowRunState';
import { type SmbDocflowTaskWithOwnership } from '@/smb-docflow/types/SmbDocflowTaskWithOwnership';
import { getSmbDocflowRunTimeline } from '@/smb-docflow/utils/getSmbDocflowRunTimeline';

const StyledTimelineTitle = styled.h3`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
`;

const StyledTimeline = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledTimelineStep = styled.li`
  align-items: baseline;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledStepName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledStepStatus = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
`;

type SmbDocflowTaskPreviewProps = {
  task: SmbDocflowTaskWithOwnership;
  onAnswered: () => void;
};

export const SmbDocflowTaskPreview = ({
  task,
  onAnswered,
}: SmbDocflowTaskPreviewProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { answerSmbDocflowForm } = useAnswerSmbDocflowForm();
  const runState = useSmbDocflowRunState(task.workflowRunId);
  const timeline = getSmbDocflowRunTimeline(runState);

  const { threadId } = task;

  return (
    <>
      <SmbDocflowPreviewTitle
        title={task.title}
        subtitle={task.workflowRunName}
      />
      {isDefined(threadId) ? (
        <SmbDocflowForm
          fields={task.fields}
          submitLabel={t`Выполнить`}
          // Someone else's task is shown as it is, but only its assignee answers it.
          isDisabled={!task.isMine}
          onSubmit={async (values) => {
            try {
              const result = await answerSmbDocflowForm({
                threadId,
                stepId: task.stepId,
                fields: task.fields,
                values,
              });

              if (result.status === 'MISSING_REQUIRED') {
                return result.fields;
              }

              onAnswered();
            } catch {
              enqueueToast({
                variant: 'error',
                children: t`Не удалось выполнить задание. Попробуйте ещё раз.`,
              });
            }

            return [];
          }}
        />
      ) : (
        <SmbDocflowEmptyState message={t`Задание ещё готовится.`} />
      )}
      {timeline.length > 0 && (
        <section aria-label={t`Шаги процесса`}>
          <StyledTimelineTitle>{t`Шаги процесса`}</StyledTimelineTitle>
          <StyledTimeline>
            {timeline.map((step) => (
              <StyledTimelineStep key={step.stepId}>
                <StyledStepName>{step.name}</StyledStepName>
                <StyledStepStatus>{step.status}</StyledStepStatus>
              </StyledTimelineStep>
            ))}
          </StyledTimeline>
        </section>
      )}
    </>
  );
};
