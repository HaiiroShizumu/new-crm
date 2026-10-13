import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowForm } from '@/smb-docflow/components/SmbDocflowForm';
import { SmbDocflowPreviewTitle } from '@/smb-docflow/components/SmbDocflowPreviewTitle';
import { useAnswerSmbDocflowForm } from '@/smb-docflow/hooks/useAnswerSmbDocflowForm';
import { type SmbDocflowTaskWithOwnership } from '@/smb-docflow/types/SmbDocflowTaskWithOwnership';

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
    </>
  );
};
