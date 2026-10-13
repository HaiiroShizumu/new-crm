import { getSmbDocflowTasksFromRun } from '@/smb-docflow/utils/getSmbDocflowTasksFromRun';
import { type WorkflowRun } from '@/workflow/types/Workflow';

const START_FORM_ID = '11111111-1111-4111-8111-111111111111';
const APPROVAL_FORM_ID = '22222222-2222-4222-8222-222222222222';
const MANAGER_ID = '33333333-3333-4333-8333-333333333333';

type StepStatusName = 'PENDING' | 'SUCCESS' | 'NOT_STARTED';

const buildRun = ({
  status = 'RUNNING',
  startStatus = 'SUCCESS',
  approvalStatus = 'PENDING',
}: {
  status?: string;
  startStatus?: StepStatusName;
  approvalStatus?: StepStatusName;
} = {}) =>
  ({
    id: 'run-1',
    name: '#12 Vacation',
    status,
    createdAt: '2026-10-13T08:00:00.000Z',
    state: {
      flow: {
        trigger: { type: 'MANUAL', nextStepIds: [START_FORM_ID] },
        steps: [
          {
            id: START_FORM_ID,
            name: 'Request',
            type: 'FORM',
            settings: {
              input: [
                { id: 'f1', name: 'manager', label: 'Manager', type: 'RECORD' },
              ],
            },
          },
          {
            id: APPROVAL_FORM_ID,
            name: 'Approve the vacation',
            type: 'FORM',
            settings: {
              input: [
                {
                  id: 'f2',
                  name: 'assignee',
                  label: 'Assignee',
                  type: 'RECORD',
                  settings: { smbRole: 'ASSIGNEE' },
                  value: `{{${START_FORM_ID}.manager.id}}`,
                },
                {
                  id: 'f3',
                  name: 'dueAt',
                  label: 'Due',
                  type: 'DATE',
                  settings: { smbRole: 'DUE_AT' },
                  value: '2026-10-15',
                },
                { id: 'f4', name: 'verdict', label: 'Verdict', type: 'TEXT' },
              ],
            },
          },
        ],
      },
      stepInfos: {
        trigger: { status: 'SUCCESS', result: {} },
        [START_FORM_ID]: {
          status: startStatus,
          result: { manager: { id: MANAGER_ID } },
          threadId: 'thread-start',
        },
        [APPROVAL_FORM_ID]: {
          status: approvalStatus,
          threadId: 'thread-approval',
        },
      },
    },
  }) as unknown as WorkflowRun;

describe('getSmbDocflowTasksFromRun', () => {
  it('turns a form step the run is waiting on into a task', () => {
    const tasks = getSmbDocflowTasksFromRun(buildRun());

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: `run-1:${APPROVAL_FORM_ID}`,
      workflowRunId: 'run-1',
      workflowRunName: '#12 Vacation',
      stepId: APPROVAL_FORM_ID,
      title: 'Approve the vacation',
      threadId: 'thread-approval',
      dueAt: '2026-10-15',
    });
  });

  it('resolves the assignee from the answer of an earlier step', () => {
    expect(
      getSmbDocflowTasksFromRun(buildRun())[0].assigneeWorkspaceMemberId,
    ).toBe(MANAGER_ID);
  });

  it('leaves a task without an assignee when the step names none', () => {
    const [task] = getSmbDocflowTasksFromRun(
      buildRun({ startStatus: 'PENDING', approvalStatus: 'NOT_STARTED' }),
    );

    expect(task.stepId).toBe(START_FORM_ID);
    expect(task.assigneeWorkspaceMemberId).toBeUndefined();
    expect(task.dueAt).toBeUndefined();
  });

  it('returns nothing once the step is answered', () => {
    expect(
      getSmbDocflowTasksFromRun(buildRun({ approvalStatus: 'SUCCESS' })),
    ).toEqual([]);
  });

  it('returns nothing for a run that is no longer running', () => {
    expect(getSmbDocflowTasksFromRun(buildRun({ status: 'FAILED' }))).toEqual(
      [],
    );
  });

  it('returns nothing for a run that has no state yet', () => {
    expect(
      getSmbDocflowTasksFromRun({
        ...buildRun(),
        state: null,
      }),
    ).toEqual([]);
  });
});
