import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type MouseEvent } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconCheck } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useRecordListContextOrThrow } from '@/object-record/record-list/contexts/RecordListContext';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type SmbRecordListRowLeadingProps } from '@/smb-skin/records/types/SmbRecordListRowLeadingProps';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';

const StyledTaskCheck = styled.button`
  align-items: center;
  background: transparent;
  border: 2px solid ${themeCssVariables.border.color.strong};
  border-radius: ${themeCssVariables.border.radius.xs};
  box-sizing: border-box;
  color: white;
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 16px;
  justify-content: center;
  padding: 0;
  width: 16px;

  &[aria-checked='true'] {
    background: ${themeCssVariables.color.blue};
    border-color: ${themeCssVariables.color.blue};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;

type SmbTaskCheckProps = SmbRecordListRowLeadingProps;

export const SmbTaskCheck = ({ recordId }: SmbTaskCheckProps) => {
  const { t } = useLingui();
  const { objectPermissions } = useRecordListContextOrThrow();
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);
  const { updateOneRecord } = useUpdateOneRecord();

  if (!isDefined(recordStore)) {
    return null;
  }

  const isDone = recordStore.status === 'DONE';
  const canUpdate = objectPermissions.canUpdateObjectRecords;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // The row itself opens the record on click
    event.stopPropagation();

    void updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Task,
      idToUpdate: recordId,
      updateOneRecordInput: { status: isDone ? 'TODO' : 'DONE' },
    });
  };

  return (
    <StyledTaskCheck
      type="button"
      role="checkbox"
      aria-checked={isDone}
      aria-label={isDone ? t`Mark as not done` : t`Mark as done`}
      data-smb-task-check
      disabled={!canUpdate}
      onClick={handleClick}
    >
      {isDone && <IconCheck size={10} stroke={3} />}
    </StyledTaskCheck>
  );
};
