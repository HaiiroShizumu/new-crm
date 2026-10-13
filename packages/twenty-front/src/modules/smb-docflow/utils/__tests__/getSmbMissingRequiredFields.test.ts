import { getSmbMissingRequiredFields } from '@/smb-docflow/utils/getSmbMissingRequiredFields';
import { type WorkflowFormActionField } from '@/workflow/workflow-steps/workflow-actions/form-action/types/WorkflowFormActionField';
import { FieldMetadataType } from 'twenty-shared/types';

const field = (
  overrides: Partial<WorkflowFormActionField> & { name: string },
): WorkflowFormActionField => ({
  id: overrides.name,
  label: overrides.name,
  type: FieldMetadataType.TEXT,
  ...overrides,
});

const required = { smbIsRequired: true };

const missingNames = (
  fields: WorkflowFormActionField[],
  values: Record<string, unknown>,
) => getSmbMissingRequiredFields({ fields, values }).map(({ name }) => name);

describe('getSmbMissingRequiredFields', () => {
  it('reports required fields that are empty', () => {
    expect(
      missingNames(
        [
          field({ name: 'reason', settings: required }),
          field({ name: 'comment' }),
        ],
        {},
      ),
    ).toEqual(['reason']);
  });

  it('accepts a required field once it has a value', () => {
    expect(
      missingNames([field({ name: 'reason', settings: required })], {
        reason: 'Vacation',
      }),
    ).toEqual([]);
  });

  it('treats blank text, an empty list and an empty record picker as empty', () => {
    const fields = [
      field({ name: 'text', settings: required }),
      field({
        name: 'tags',
        type: FieldMetadataType.MULTI_SELECT,
        settings: required,
      }),
      field({ name: 'manager', type: 'RECORD', settings: required }),
    ];

    expect(
      missingNames(fields, { text: '   ', tags: [], manager: { id: '' } }),
    ).toEqual(['text', 'tags', 'manager']);
  });

  it('accepts zero and false as real answers', () => {
    expect(
      missingNames(
        [
          field({
            name: 'days',
            type: FieldMetadataType.NUMBER,
            settings: required,
          }),
        ],
        { days: 0 },
      ),
    ).toEqual([]);
  });

  it('falls back to the default value the process put into the field', () => {
    expect(
      missingNames(
        [field({ name: 'reason', settings: required, value: 'Default' })],
        {},
      ),
    ).toEqual([]);
  });

  it('lets a cleared answer override the default value', () => {
    expect(
      missingNames(
        [field({ name: 'reason', settings: required, value: 'Default' })],
        { reason: '' },
      ),
    ).toEqual(['reason']);
  });

  it('never asks a person for a service field', () => {
    expect(
      missingNames(
        [
          field({
            name: 'assignee',
            type: 'RECORD',
            settings: { ...required, smbRole: 'ASSIGNEE' },
          }),
        ],
        {},
      ),
    ).toEqual([]);
  });
});
