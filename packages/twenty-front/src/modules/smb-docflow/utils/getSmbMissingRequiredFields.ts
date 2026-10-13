import { getSmbFillableFormFields } from '@/smb-docflow/utils/getSmbFillableFormFields';
import { isSmbFormFieldRequired } from '@/smb-docflow/utils/isSmbFormFieldRequired';
import { isSmbFormValueEmpty } from '@/smb-docflow/utils/isSmbFormValueEmpty';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

export const getSmbMissingRequiredFields = ({
  fields,
  values,
}: {
  fields: WorkflowFormActionField[];
  values: Record<string, unknown>;
}): WorkflowFormActionField[] =>
  getSmbFillableFormFields(fields).filter(
    (field) =>
      isSmbFormFieldRequired(field) &&
      isSmbFormValueEmpty(
        field.name in values ? values[field.name] : field.value,
      ),
  );
