import { getSmbProcessStartForm } from '@/smb-docflow/utils/getSmbProcessStartForm';
import {
  type WorkflowStep,
  type WorkflowTrigger,
} from '@/workflow/types/Workflow';

const FORM_STEP_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_STEP_ID = '22222222-2222-4222-8222-222222222222';

const manualTrigger = (nextStepIds: string[]): WorkflowTrigger =>
  ({
    type: 'MANUAL',
    name: 'Launch manually',
    settings: { outputSchema: {} },
    nextStepIds,
  }) as WorkflowTrigger;

const formStep = {
  id: FORM_STEP_ID,
  name: 'Vacation request',
  type: 'FORM',
  valid: true,
  settings: { input: [], outputSchema: {}, errorHandlingOptions: {} },
} as unknown as WorkflowStep;

const otherStep = {
  id: OTHER_STEP_ID,
  name: 'Create record',
  type: 'CREATE_RECORD',
  valid: true,
} as unknown as WorkflowStep;

describe('getSmbProcessStartForm', () => {
  it('returns the form that is the single first step of a manual process', () => {
    expect(
      getSmbProcessStartForm({
        trigger: manualTrigger([FORM_STEP_ID]),
        steps: [otherStep, formStep],
      })?.id,
    ).toBe(FORM_STEP_ID);
  });

  it('returns nothing when the first step is not a form', () => {
    expect(
      getSmbProcessStartForm({
        trigger: manualTrigger([OTHER_STEP_ID]),
        steps: [otherStep, formStep],
      }),
    ).toBeUndefined();
  });

  it('returns nothing when the process starts with several steps at once', () => {
    expect(
      getSmbProcessStartForm({
        trigger: manualTrigger([FORM_STEP_ID, OTHER_STEP_ID]),
        steps: [otherStep, formStep],
      }),
    ).toBeUndefined();
  });

  it('returns nothing for a process that is not started by a person', () => {
    expect(
      getSmbProcessStartForm({
        trigger: {
          ...manualTrigger([FORM_STEP_ID]),
          type: 'CRON',
        } as unknown as WorkflowTrigger,
        steps: [formStep],
      }),
    ).toBeUndefined();
  });

  it('returns nothing for a process without a trigger or steps', () => {
    expect(
      getSmbProcessStartForm({ trigger: null, steps: null }),
    ).toBeUndefined();
    expect(
      getSmbProcessStartForm({
        trigger: manualTrigger([FORM_STEP_ID]),
        steps: null,
      }),
    ).toBeUndefined();
  });
});
