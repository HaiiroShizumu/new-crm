import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

// The answer of a form step carries every field, service ones included: the
// following steps of the process read the assignee and the deadline from it.
export const buildSmbFormResponse = ({
  fields,
  values,
}: {
  fields: WorkflowFormActionField[];
  values: Record<string, unknown>;
}): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.name in values ? values[field.name] : field.value,
    ]),
  );
