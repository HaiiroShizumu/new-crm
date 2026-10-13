import { getSmbDocflowRunTimeline } from '@/smb-docflow/utils/getSmbDocflowRunTimeline';
import { type WorkflowRun } from '@/workflow/types/Workflow';

const START_FORM_ID = '11111111-1111-4111-8111-111111111111';
const APPROVAL_FORM_ID = '22222222-2222-4222-8222-222222222222';

const buildState = ({
  startStatus = 'SUCCESS',
  approvalStatus,
}: {
  startStatus?: string;
  approvalStatus?: string;
} = {}) =>
  ({
    flow: {
      trigger: { type: 'MANUAL', nextStepIds: [START_FORM_ID] },
      steps: [
        { id: START_FORM_ID, name: 'Request', type: 'FORM' },
        { id: APPROVAL_FORM_ID, name: 'Approve the vacation', type: 'FORM' },
      ],
    },
    stepInfos: {
      [START_FORM_ID]: { status: startStatus },
      ...(approvalStatus === undefined
        ? {}
        : { [APPROVAL_FORM_ID]: { status: approvalStatus } }),
    },
  }) as unknown as WorkflowRun['state'];

describe('getSmbDocflowRunTimeline', () => {
  it('ведёт шаги в порядке схемы процесса и берёт статус из состояния', () => {
    const timeline = getSmbDocflowRunTimeline(
      buildState({ approvalStatus: 'PENDING' }),
    );

    expect(timeline).toEqual([
      { stepId: START_FORM_ID, name: 'Request', status: 'SUCCESS' },
      {
        stepId: APPROVAL_FORM_ID,
        name: 'Approve the vacation',
        status: 'PENDING',
      },
    ]);
  });

  it('помечает шаг без записи в состоянии как не начатый', () => {
    const timeline = getSmbDocflowRunTimeline(buildState());

    expect(timeline).toHaveLength(2);
    expect(timeline[1]).toEqual({
      stepId: APPROVAL_FORM_ID,
      name: 'Approve the vacation',
      status: 'NOT_STARTED',
    });
  });

  it('возвращает пустой список для состояния без запуска', () => {
    expect(getSmbDocflowRunTimeline(null)).toEqual([]);
  });
});
