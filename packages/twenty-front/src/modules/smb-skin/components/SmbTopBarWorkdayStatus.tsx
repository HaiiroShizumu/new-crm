import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  type IconComponent,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
} from 'twenty-ui/icon';
import { ListItem } from 'twenty-ui/primitives/navigation';
import { themeCssVariables } from 'twenty-ui/theme';

import { smbWorkdayStatusState } from '@/smb-skin/states/smbWorkdayStatusState';
import { type SmbWorkdayStatus } from '@/smb-skin/types/SmbWorkdayStatus';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

const SMB_WORKDAY_STATUS_DROPDOWN_ID = 'smb-workday-status-dropdown';

const WORKDAY_STATUS_ICONS: Record<SmbWorkdayStatus, IconComponent> = {
  started: IconPlayerPlay,
  paused: IconPlayerPause,
  finished: IconPlayerStop,
};

const WORKDAY_STATUS_COLORS: Record<SmbWorkdayStatus, string> = {
  started: themeCssVariables.color.green9,
  paused: themeCssVariables.color.orange9,
  finished: themeCssVariables.font.color.tertiary,
};

const WORKDAY_STATUSES: SmbWorkdayStatus[] = ['started', 'paused', 'finished'];

const StyledStatusButton = styled.button<{ statusColor: string }>`
  align-items: center;
  color: ${({ statusColor }) => statusColor};
  cursor: pointer;
  display: flex;
`;

const StyledMenuIcon = styled.span<{ statusColor: string }>`
  color: ${({ statusColor }) => statusColor};
  display: flex;
`;

export const SmbTopBarWorkdayStatus = () => {
  const { t } = useLingui();
  const { closeDropdown } = useCloseDropdown();
  const [smbWorkdayStatus, setSmbWorkdayStatus] = useAtomState(
    smbWorkdayStatusState,
  );

  const workdayStatusLabels: Record<SmbWorkdayStatus, string> = {
    started: t`Workday started`,
    paused: t`Workday paused`,
    finished: t`Workday finished`,
  };

  const CurrentStatusIcon = WORKDAY_STATUS_ICONS[smbWorkdayStatus];

  const handleSelect = (status: SmbWorkdayStatus) => {
    setSmbWorkdayStatus(status);
    closeDropdown(SMB_WORKDAY_STATUS_DROPDOWN_ID);
  };

  return (
    <Dropdown
      dropdownId={SMB_WORKDAY_STATUS_DROPDOWN_ID}
      dropdownPlacement="bottom-end"
      clickableComponent={
        <StyledStatusButton
          type="button"
          statusColor={WORKDAY_STATUS_COLORS[smbWorkdayStatus]}
          aria-label={workdayStatusLabels[smbWorkdayStatus]}
          title={workdayStatusLabels[smbWorkdayStatus]}
        >
          <CurrentStatusIcon size={20} />
        </StyledStatusButton>
      }
      dropdownComponents={
        <DropdownContent>
          <DropdownMenuItemsContainer>
            {WORKDAY_STATUSES.map((status) => {
              const StatusIcon = WORKDAY_STATUS_ICONS[status];

              return (
                <ListItem
                  key={status}
                  onClick={() => handleSelect(status)}
                  role="option"
                  aria-selected={status === smbWorkdayStatus}
                  selected={status === smbWorkdayStatus}
                  indicator="check"
                  startIcon={
                    <StyledMenuIcon statusColor={WORKDAY_STATUS_COLORS[status]}>
                      <StatusIcon size={16} />
                    </StyledMenuIcon>
                  }
                >
                  {workdayStatusLabels[status]}
                </ListItem>
              );
            })}
          </DropdownMenuItemsContainer>
        </DropdownContent>
      }
    />
  );
};
