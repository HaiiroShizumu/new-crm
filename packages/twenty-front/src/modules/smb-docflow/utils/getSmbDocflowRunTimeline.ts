import {
  type WorkflowRun,
  type WorkflowRunStepStatus,
} from '@/workflow/types/Workflow';
import { isDefined } from 'twenty-shared/utils';
import { StepStatus } from 'twenty-shared/workflow';

type SmbDocflowRunTimelineStep = {
  stepId: string;
  name: string;
  status: WorkflowRunStepStatus;
};

// Шаги так, как они идут в схеме процесса: статус берётся из состояния
// запуска, шаг, до которого дело не дошло, помечается как ещё не начатый.
export const getSmbDocflowRunTimeline = (
  state: WorkflowRun['state'] | undefined,
): SmbDocflowRunTimelineStep[] => {
  if (!isDefined(state)) {
    return [];
  }

  return state.flow.steps.map((step) => ({
    stepId: step.id,
    name: step.name,
    status: state.stepInfos[step.id]?.status ?? StepStatus.NOT_STARTED,
  }));
};
