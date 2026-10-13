import {
  type WorkflowFormAction,
  type WorkflowStep,
  type WorkflowTrigger,
} from '@/workflow/types/Workflow';
import { isDefined } from 'twenty-shared/utils';

// The parameters of a process are the form that is the single first step of a
// manually started workflow. A process whose first step is anything else, or
// that fans out into several first steps, starts without asking anything.
export const getSmbProcessStartForm = ({
  trigger,
  steps,
}: {
  trigger: WorkflowTrigger | null;
  steps: WorkflowStep[] | null;
}): WorkflowFormAction | undefined => {
  if (!isDefined(trigger) || trigger.type !== 'MANUAL') {
    return undefined;
  }

  const firstStepIds = trigger.nextStepIds ?? [];

  if (firstStepIds.length !== 1) {
    return undefined;
  }

  const firstStep = (steps ?? []).find((step) => step.id === firstStepIds[0]);

  return isDefined(firstStep) && firstStep.type === 'FORM'
    ? firstStep
    : undefined;
};
