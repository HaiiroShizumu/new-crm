import { type ReactNode, useMemo } from 'react';

import { smbChromeActionsHostState } from '@/smb-skin/states/smbChromeActionsHostState';
import { smbChromeTitleHostState } from '@/smb-skin/states/smbChromeTitleHostState';
import { smbChromeTopBarActionsHostState } from '@/smb-skin/states/smbChromeTopBarActionsHostState';
import { WorkspaceSurfaceHeaderPortalContext } from '@/ui/layout/contexts/WorkspaceSurfaceHeaderPortalContext';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type SmbChromeHeaderPortalProviderProps = {
  children: ReactNode;
};

// Feeds upstream's own header-portal context (the one the side panel uses)
// with the shell's hosts: page titles render in the app top bar, page actions
// in the view bar when the page has one and in the top bar otherwise.
// Without a top bar (mobile, fullscreen) the hosts are null and PageCardHeader
// keeps its stock in-page header.
export const SmbChromeHeaderPortalProvider = ({
  children,
}: SmbChromeHeaderPortalProviderProps) => {
  const smbChromeTitleHost = useAtomStateValue(smbChromeTitleHostState);
  const smbChromeActionsHost = useAtomStateValue(smbChromeActionsHostState);
  const smbChromeTopBarActionsHost = useAtomStateValue(
    smbChromeTopBarActionsHostState,
  );

  const headerPortal = useMemo(
    () => ({
      title: smbChromeTitleHost,
      actions: smbChromeActionsHost ?? smbChromeTopBarActionsHost,
    }),
    [smbChromeTitleHost, smbChromeActionsHost, smbChromeTopBarActionsHost],
  );

  return (
    <WorkspaceSurfaceHeaderPortalContext.Provider value={headerPortal}>
      {children}
    </WorkspaceSurfaceHeaderPortalContext.Provider>
  );
};
