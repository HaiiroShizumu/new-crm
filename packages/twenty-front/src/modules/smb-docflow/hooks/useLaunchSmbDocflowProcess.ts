import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useFindOneRecordQuery } from '@/object-record/hooks/useFindOneRecordQuery';
import { SMB_DOCFLOW_START_FORM_POLL_ATTEMPTS } from '@/smb-docflow/constants/SmbDocflowStartFormPollAttempts';
import { SMB_DOCFLOW_START_FORM_POLL_INTERVAL_MS } from '@/smb-docflow/constants/SmbDocflowStartFormPollIntervalMs';
import { useAnswerSmbDocflowForm } from '@/smb-docflow/hooks/useAnswerSmbDocflowForm';
import { type SmbDocflowProcess } from '@/smb-docflow/types/SmbDocflowProcess';
import { getSmbMissingRequiredFields } from '@/smb-docflow/utils/getSmbMissingRequiredFields';
import { RUN_WORKFLOW_VERSION } from '@/workflow/graphql/mutations/runWorkflowVersion';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { isNonEmptyString } from '@sniptt/guards';
import { useCallback } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { sleep } from '~/utils/sleep';

type LaunchSmbDocflowProcessResult =
  | { status: 'STARTED'; workflowRunId: string }
  // The process runs, but its start form was not open in time. Nothing is
  // lost: the form waits in the task list of whoever started the process.
  | { status: 'STARTED_FORM_PENDING'; workflowRunId: string }
  | { status: 'MISSING_REQUIRED'; fields: WorkflowFormActionField[] };

export const useLaunchSmbDocflowProcess = () => {
  const apolloCoreClient = useApolloCoreClient();
  const { answerSmbDocflowForm } = useAnswerSmbDocflowForm();

  const { findOneRecordQuery: findOneWorkflowRunQuery } = useFindOneRecordQuery(
    {
      objectNameSingular: CoreObjectNameSingular.WorkflowRun,
      recordGqlFields: { id: true, status: true, state: true },
    },
  );

  const waitForStartFormThreadId = useCallback(
    async (workflowRunId: string, stepId: string) => {
      for (
        let attempt = 0;
        attempt < SMB_DOCFLOW_START_FORM_POLL_ATTEMPTS;
        attempt++
      ) {
        await sleep(SMB_DOCFLOW_START_FORM_POLL_INTERVAL_MS);

        const { data } = await apolloCoreClient.query<{
          workflowRun?: {
            state?: {
              stepInfos?: Record<
                string,
                { status?: string; threadId?: string } | undefined
              >;
            } | null;
          } | null;
        }>({
          query: findOneWorkflowRunQuery,
          variables: { objectRecordId: workflowRunId },
          fetchPolicy: 'network-only',
        });

        const stepInfo = data?.workflowRun?.state?.stepInfos?.[stepId];

        if (
          stepInfo?.status === 'PENDING' &&
          isNonEmptyString(stepInfo.threadId)
        ) {
          return stepInfo.threadId;
        }
      }

      return undefined;
    },
    [apolloCoreClient, findOneWorkflowRunQuery],
  );

  // Starting with parameters is two standard calls in a row: run the
  // workflow, then answer its first form with what the person entered before
  // pressing Start. Required fields are checked first, so a process never
  // starts with a form that cannot be completed.
  const launchSmbDocflowProcess = useCallback(
    async ({
      process,
      values,
    }: {
      process: SmbDocflowProcess;
      values: Record<string, unknown>;
    }): Promise<LaunchSmbDocflowProcessResult> => {
      const startFormFields = process.startForm?.settings.input ?? [];
      const missingFields = getSmbMissingRequiredFields({
        fields: startFormFields,
        values,
      });

      if (missingFields.length > 0) {
        return { status: 'MISSING_REQUIRED', fields: missingFields };
      }

      const workflowRunId = v4();

      await apolloCoreClient.mutate({
        mutation: RUN_WORKFLOW_VERSION,
        variables: {
          input: {
            workflowVersionId: process.workflowVersionId,
            workflowRunId,
          },
        },
      });

      if (!isDefined(process.startForm)) {
        return { status: 'STARTED', workflowRunId };
      }

      const threadId = await waitForStartFormThreadId(
        workflowRunId,
        process.startForm.id,
      );

      if (!isDefined(threadId)) {
        return { status: 'STARTED_FORM_PENDING', workflowRunId };
      }

      await answerSmbDocflowForm({
        threadId,
        stepId: process.startForm.id,
        fields: startFormFields,
        values,
      });

      return { status: 'STARTED', workflowRunId };
    },
    [answerSmbDocflowForm, apolloCoreClient, waitForStartFormThreadId],
  );

  return { launchSmbDocflowProcess };
};
