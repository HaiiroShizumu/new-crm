import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';
import { getSmbFormFieldRole } from '@/smb-docflow/utils/getSmbFormFieldRole';
import { type WorkflowRun } from '@/workflow/types/Workflow';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { isNonEmptyString, isObject } from '@sniptt/guards';
import { isDefined, resolveInput } from 'twenty-shared/utils';
import { getWorkflowRunContext } from 'twenty-shared/workflow';

const readAssigneeId = (
  fields: WorkflowFormActionField[],
): string | undefined => {
  const value: unknown = fields.find(
    (field) => getSmbFormFieldRole(field) === 'ASSIGNEE',
  )?.value;

  if (isNonEmptyString(value)) {
    return value;
  }

  return isObject(value) && 'id' in value && isNonEmptyString(value.id)
    ? value.id
    : undefined;
};

const readDueAt = (fields: WorkflowFormActionField[]): string | undefined => {
  const value: unknown = fields.find(
    (field) => getSmbFormFieldRole(field) === 'DUE_AT',
  )?.value;

  return isNonEmptyString(value) ? value : undefined;
};

// A run asks for attention through every form step it is paused on. The run
// keeps its own copy of the flow, so a task shows the form as it was when the
// process started, even if the process was edited since.
export const getSmbDocflowTasksFromRun = (
  workflowRun: Pick<
    WorkflowRun,
    'id' | 'name' | 'state' | 'status' | 'createdAt'
  >,
): SmbDocflowTask[] => {
  const { state } = workflowRun;

  if (!isDefined(state) || workflowRun.status !== 'RUNNING') {
    return [];
  }

  return state.flow.steps.flatMap((step) => {
    const stepInfo = state.stepInfos[step.id];

    if (step.type !== 'FORM' || stepInfo?.status !== 'PENDING') {
      return [];
    }

    // The form step stores its fields as written in the process, variables
    // included. The assignee and the deadline usually point at an earlier
    // step ("the manager picked in the start form"), so they are resolved
    // here against what those steps returned.
    const runContext = getWorkflowRunContext(state.stepInfos);
    const fields = step.settings.input.map((field) =>
      isDefined(getSmbFormFieldRole(field))
        ? { ...field, value: resolveInput(field.value, runContext) }
        : field,
    );

    return [
      {
        id: `${workflowRun.id}:${step.id}`,
        workflowRunId: workflowRun.id,
        workflowRunName: workflowRun.name,
        stepId: step.id,
        title: step.name,
        threadId: stepInfo.threadId,
        assigneeWorkspaceMemberId: readAssigneeId(fields),
        dueAt: readDueAt(fields),
        createdAt: workflowRun.createdAt,
        fields,
      },
    ];
  });
};
