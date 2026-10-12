import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { isNavigationDrawerExpandedState } from '@/ui/navigation/states/isNavigationDrawerExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Two-level mode owns collapse via the secondary panel; the drawer itself
// must stay expanded whenever it is mounted next to the icon rail.
export const useNavigationDrawerExpanded = () => {
  const isNavigationDrawerExpanded = useAtomStateValue(
    isNavigationDrawerExpandedState,
  );
  const { showIconRail } = useNavigationChromeLayout();

  return showIconRail || isNavigationDrawerExpanded;
};
