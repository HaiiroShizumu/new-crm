import { useAnswerToolCall } from '@/ai/hooks/useAnswerToolCall';
import { buildSmbFormResponse } from '@/smb-docflow/utils/buildSmbFormResponse';
import { getSmbMissingRequiredFields } from '@/smb-docflow/utils/getSmbMissingRequiredFields';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { useCallback } from 'react';

type AnswerSmbDocflowFormResult =
  | { status: 'ANSWERED' }
  | { status: 'MISSING_REQUIRED'; fields: WorkflowFormActionField[] };

// The one place a docflow form is submitted from, so required fields are
// checked the same way for a start form and for a task.
export const useAnswerSmbDocflowForm = () => {
  const { answerToolCall } = useAnswerToolCall();

  const answerSmbDocflowForm = useCallback(
    async ({
      threadId,
      stepId,
      fields,
      values,
    }: {
      threadId: string;
      stepId: string;
      fields: WorkflowFormActionField[];
      values: Record<string, unknown>;
    }): Promise<AnswerSmbDocflowFormResult> => {
      const missingFields = getSmbMissingRequiredFields({ fields, values });

      if (missingFields.length > 0) {
        return { status: 'MISSING_REQUIRED', fields: missingFields };
      }

      await answerToolCall({
        threadId,
        toolCallId: stepId,
        response: buildSmbFormResponse({ fields, values }),
      });

      return { status: 'ANSWERED' };
    },
    [answerToolCall],
  );

  return { answerSmbDocflowForm };
};
