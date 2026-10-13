import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { getSmbFillableFormFields } from '@/smb-docflow/utils/getSmbFillableFormFields';
import { isSmbFormFieldRequired } from '@/smb-docflow/utils/isSmbFormFieldRequired';
import { WorkflowFormFields } from '@/workflow/workflow-steps/workflow-actions/form-action/components/WorkflowFormFields';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';

const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledError = styled.div`
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.sm};
`;

type SmbDocflowFormProps = {
  fields: WorkflowFormActionField[];
  submitLabel: string;
  isDisabled?: boolean;
  // Resolves with the fields that still have to be filled, empty when sent.
  onSubmit: (
    values: Record<string, unknown>,
  ) => Promise<WorkflowFormActionField[]>;
};

// Renders a form step with the standard field inputs and adds what the
// standard form lacks: required fields.
export const SmbDocflowForm = ({
  fields,
  submitLabel,
  isDisabled = false,
  onSubmit,
}: SmbDocflowFormProps) => {
  const { t } = useLingui();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [missingLabels, setMissingLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fillableFields = getSmbFillableFormFields(fields).map((field) => ({
    ...field,
    label: isSmbFormFieldRequired(field) ? `${field.label} *` : field.label,
  }));

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const missingFields = await onSubmit(values);

      setMissingLabels(missingFields.map(({ label }) => label));
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingLabelList = missingLabels.join(', ');

  return (
    <StyledForm>
      <WorkflowFormFields
        fields={fillableFields}
        readonly={isDisabled || isSubmitting}
        onChange={(fieldName, value) =>
          setValues((currentValues) => ({
            ...currentValues,
            [fieldName]: value,
          }))
        }
      />
      {missingLabels.length > 0 && (
        <StyledError role="alert">{t`Заполните: ${missingLabelList}`}</StyledError>
      )}
      <Button
        variant="solid"
        size="sm"
        disabled={isDisabled}
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {submitLabel}
      </Button>
    </StyledForm>
  );
};
