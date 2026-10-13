import { SMB_FORM_FIELD_REQUIRED_SETTING } from '@/smb-docflow/constants/SmbFormFieldRequiredSetting';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

export const isSmbFormFieldRequired = (
  field: Pick<WorkflowFormActionField, 'settings'>,
): boolean => field.settings?.[SMB_FORM_FIELD_REQUIRED_SETTING] === true;
