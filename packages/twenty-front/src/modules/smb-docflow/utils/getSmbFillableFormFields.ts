import { getSmbFormFieldRole } from '@/smb-docflow/utils/getSmbFormFieldRole';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { isDefined } from 'twenty-shared/utils';

// The fields a person sees and fills: service fields (assignee, deadline) are
// set by the process and stay out of the form.
export const getSmbFillableFormFields = (
  fields: WorkflowFormActionField[],
): WorkflowFormActionField[] =>
  fields.filter((field) => !isDefined(getSmbFormFieldRole(field)));
