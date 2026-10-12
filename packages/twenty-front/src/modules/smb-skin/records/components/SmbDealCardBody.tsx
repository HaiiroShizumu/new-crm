import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext } from 'react';
import { isDefined, isPlainObject } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { RecordBoardCardContext } from '@/object-record/record-board/record-board-card/contexts/RecordBoardCardContext';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { SmbRecordPersonAvatar } from '@/smb-skin/records/components/SmbRecordPersonAvatar';
import { formatSmbCurrencyAmount } from '@/smb-skin/records/utils/formatSmbCurrencyAmount';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledDealCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--smb-card-gap, ${themeCssVariables.spacing[2]});
  padding: 0 var(--smb-card-pad, ${themeCssVariables.spacing[3]})
    var(--smb-card-pad, ${themeCssVariables.spacing[3]});
`;

const StyledCompany = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledAmount = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-variant-numeric: tabular-nums;
  font-weight: 800;
`;

const StyledFooter = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  min-height: 24px;
`;

const StyledDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const SmbDealCardBody = () => {
  const { i18n } = useLingui();
  const { recordId } = useContext(RecordBoardCardContext);
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);

  if (!isDefined(recordStore)) {
    return null;
  }

  // Only fields the view fetches are present, so every part is optional
  const companyName =
    isPlainObject(recordStore.company) &&
    isNonEmptyString(recordStore.company.name)
      ? recordStore.company.name
      : null;
  const formattedAmount = isPlainObject(recordStore.amount)
    ? formatSmbCurrencyAmount({
        i18n,
        amountMicros: recordStore.amount.amountMicros,
        currencyCode: recordStore.amount.currencyCode,
      })
    : null;
  const formattedCloseDate = isNonEmptyString(recordStore.closeDate)
    ? formatToHumanReadableDate(recordStore.closeDate)
    : null;
  const owner = recordStore.owner ?? recordStore.pointOfContact;

  return (
    <StyledDealCardBody data-smb-card-body="opportunity">
      {companyName !== null && <StyledCompany>{companyName}</StyledCompany>}
      {formattedAmount !== null && (
        <StyledAmount data-smb-deal-amount>{formattedAmount}</StyledAmount>
      )}
      {(formattedCloseDate !== null || isDefined(owner)) && (
        <StyledFooter>
          <StyledDate>{formattedCloseDate}</StyledDate>
          <SmbRecordPersonAvatar person={owner} />
        </StyledFooter>
      )}
    </StyledDealCardBody>
  );
};
