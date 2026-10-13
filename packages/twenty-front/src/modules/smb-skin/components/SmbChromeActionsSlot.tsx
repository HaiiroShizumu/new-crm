import { styled } from '@linaria/react';

import { smbChromeActionsHostState } from '@/smb-skin/states/smbChromeActionsHostState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledSlot = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;

  &:empty {
    display: none;
  }
`;

// Mounted by the view bar (P-026). While it is on screen, page header actions
// are portaled here instead of the top bar, so "Create" sits in the same row
// as filter and sort.
export const SmbChromeActionsSlot = () => {
  const setSmbChromeActionsHost = useSetAtomState(smbChromeActionsHostState);

  return <StyledSlot data-smb-chrome-actions ref={setSmbChromeActionsHost} />;
};
