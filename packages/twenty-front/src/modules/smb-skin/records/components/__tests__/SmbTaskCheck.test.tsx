import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as JotaiProvider } from 'jotai';

import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { RecordListContextProvider } from '@/object-record/record-list/contexts/RecordListContext';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { SmbTaskCheck } from '@/smb-skin/records/components/SmbTaskCheck';
import { resetJotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { type ObjectPermission } from '~/generated-metadata/graphql';

const mockUpdateOneRecord = jest.fn();

jest.mock('@/object-record/hooks/useUpdateOneRecord', () => ({
  useUpdateOneRecord: () => ({ updateOneRecord: mockUpdateOneRecord }),
}));

const renderTaskCheck = ({
  status,
  canUpdateObjectRecords = true,
}: {
  status: string;
  canUpdateObjectRecords?: boolean;
}) => {
  const store = resetJotaiStore();
  store.set(recordStoreFamilyState.atomFamily('task-1'), {
    id: 'task-1',
    __typename: 'Task',
    status,
  });

  const handleRowClick = jest.fn();

  render(
    <I18nProvider i18n={i18n}>
      <JotaiProvider store={store}>
        <RecordListContextProvider
          value={{
            viewBarInstanceId: 'view-bar',
            objectNameSingular: 'task',
            objectMetadataItem: {} as EnrichedObjectMetadataItem,
            objectPermissions: {
              canUpdateObjectRecords,
            } as ObjectPermission,
          }}
        >
          {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div onClick={handleRowClick}>
            <SmbTaskCheck recordId="task-1" />
          </div>
        </RecordListContextProvider>
      </JotaiProvider>
    </I18nProvider>,
  );

  return { handleRowClick };
};

describe('SmbTaskCheck', () => {
  beforeEach(() => {
    mockUpdateOneRecord.mockClear();
  });

  it('marks an open task as done without opening the record', async () => {
    const { handleRowClick } = renderTaskCheck({ status: 'TODO' });

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Mark as done' }),
    );

    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'task',
      idToUpdate: 'task-1',
      updateOneRecordInput: { status: 'DONE' },
    });
    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('reopens a done task', async () => {
    renderTaskCheck({ status: 'DONE' });

    const check = screen.getByRole('checkbox', { name: 'Mark as not done' });

    expect(check).toBeChecked();

    await userEvent.click(check);

    expect(mockUpdateOneRecord).toHaveBeenCalledWith(
      expect.objectContaining({ updateOneRecordInput: { status: 'TODO' } }),
    );
  });

  it('is disabled without update permission', () => {
    renderTaskCheck({ status: 'TODO', canUpdateObjectRecords: false });

    expect(
      screen.getByRole('checkbox', { name: 'Mark as done' }),
    ).toBeDisabled();
  });
});
