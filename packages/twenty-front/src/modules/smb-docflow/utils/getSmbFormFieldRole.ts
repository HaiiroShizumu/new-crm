import { SMB_FORM_FIELD_ROLE_SETTING } from '@/smb-docflow/constants/SmbFormFieldRoleSetting';
import { type SmbFormFieldRole } from '@/smb-docflow/types/SmbFormFieldRole';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

export const getSmbFormFieldRole = (
  field: Pick<WorkflowFormActionField, 'settings'>,
): SmbFormFieldRole | undefined => {
  const role: unknown = field.settings?.[SMB_FORM_FIELD_ROLE_SETTING];

  return role === 'ASSIGNEE' || role === 'DUE_AT' ? role : undefined;
};
