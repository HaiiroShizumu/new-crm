import { SmbDocflowForm } from '@/smb-docflow/components/SmbDocflowForm';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldMetadataType } from 'twenty-shared/types';

// Поле RICH_TEXT тянет BlockNote, а его ESM-зависимости jest не умеет
// трансформировать (transformIgnorePatterns в jest.config.mjs). Наши поля —
// TEXT, поэтому редактор здесь не нужен.
jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormRecordRichTextFieldInput',
  () => ({
    FormRecordRichTextFieldInput: () => null,
  }),
);

const REQUIRED_FIELD: WorkflowFormActionField = {
  id: 'field-reason',
  name: 'reason',
  label: 'Причина',
  type: FieldMetadataType.TEXT,
  settings: { smbIsRequired: true },
};

const ROLE_FIELD: WorkflowFormActionField = {
  id: 'field-assignee',
  name: 'assignee',
  label: 'Исполнитель',
  type: FieldMetadataType.TEXT,
  settings: { smbRole: 'ASSIGNEE' },
};

type SubmitHandler = (
  values: Record<string, unknown>,
) => Promise<WorkflowFormActionField[]>;

const renderForm = (onSubmit: SubmitHandler) =>
  render(
    <I18nProvider i18n={i18n}>
      <SmbDocflowForm
        fields={[REQUIRED_FIELD, ROLE_FIELD]}
        submitLabel="Выполнить"
        onSubmit={onSubmit}
      />
    </I18nProvider>,
  );

describe('SmbDocflowForm', () => {
  it('отдаёт пустым значениям незаполненное обязательное поле и показывает «Заполните: …»', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue([REQUIRED_FIELD]);
    renderForm(onSubmit);

    await user.click(screen.getByRole('button', { name: 'Выполнить' }));

    expect(onSubmit).toHaveBeenCalledWith({});
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Заполните:');
    expect(alert).toHaveTextContent('Причина');
  });

  it('ставит звёздочку в подписи обязательного поля', () => {
    renderForm(jest.fn().mockResolvedValue([]));

    expect(screen.getByText('Причина *')).toBeInTheDocument();
  });

  it('не показывает поле со служебной ролью', () => {
    renderForm(jest.fn().mockResolvedValue([]));

    expect(screen.queryByText('Исполнитель')).not.toBeInTheDocument();
    expect(screen.getByText('Причина *')).toBeInTheDocument();
  });
});
