import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { RecordBoardCardContext } from '@/object-record/record-board/record-board-card/contexts/RecordBoardCardContext';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { SmbPriorityBadge } from '@/smb-skin/records/components/SmbPriorityBadge';
import { SmbRecordPersonAvatar } from '@/smb-skin/records/components/SmbRecordPersonAvatar';
import { findSmbSelectOption } from '@/smb-skin/records/utils/findSmbSelectOption';
import { isSmbTaskOverdue } from '@/smb-skin/records/utils/isSmbTaskOverdue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledTaskCardBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--smb-card-gap, ${themeCssVariables.spacing[2]});
  padding: 0 var(--smb-card-pad, ${themeCssVariables.spacing[3]})
    var(--smb-card-pad, ${themeCssVariables.spacing[3]});
`;

const StyledMetaRow = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: 10px;
  font-weight: 600;
  gap: ${themeCssVariables.spacing[2]};

  &[data-overdue='true'] [data-smb-task-due] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledFooter = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  min-height: 22px;
`;

export const SmbTaskCardBody = () => {
  const { recordId } = useContext(RecordBoardCardContext);
  const { objectMetadataItem } = useContext(RecordBoardContext);
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);

  if (!isDefined(recordStore)) {
    return null;
  }

  // Standard Twenty tasks have no priority; workspaces may add a select field
  const priorityOption = findSmbSelectOption({
    objectMetadataItem,
    fieldName: 'priority',
    value: recordStore.priority,
  });
  const formattedDueDate = isNonEmptyString(recordStore.dueAt)
    ? formatToHumanReadableDate(recordStore.dueAt)
    : null;
  const isOverdue = isSmbTaskOverdue({
    dueAt: recordStore.dueAt,
    status: recordStore.status,
  });

  return (
    <StyledTaskCardBody data-smb-card-body="task">
      {(priorityOption !== null || formattedDueDate !== null) && (
        <StyledMetaRow data-overdue={isOverdue}>
          {priorityOption !== null && (
            <SmbPriorityBadge
              label={priorityOption.label}
              color={priorityOption.color}
            />
          )}
          {formattedDueDate !== null && (
            <span data-smb-task-due>{formattedDueDate}</span>
          )}
        </StyledMetaRow>
      )}
      <StyledFooter>
        <SmbRecordPersonAvatar person={recordStore.assignee} size="sm" />
      </StyledFooter>
    </StyledTaskCardBody>
  );
};
