import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

// A task of the docflow module: one form step a process is waiting on.
export type SmbDocflowTask = {
  id: string;
  workflowRunId: string;
  workflowRunName: string;
  stepId: string;
  title: string;
  // Missing while the server has not opened the step yet; such a task cannot be answered.
  threadId: string | undefined;
  assigneeWorkspaceMemberId: string | undefined;
  dueAt: string | undefined;
  createdAt: string;
  fields: WorkflowFormActionField[];
};
