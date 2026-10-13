import { type WorkflowFormAction } from '@/workflow/types/Workflow';

// A process a person can start: the published version of a manual workflow.
export type SmbDocflowProcess = {
  workflowId: string;
  workflowVersionId: string;
  name: string;
  startForm: WorkflowFormAction | undefined;
};
