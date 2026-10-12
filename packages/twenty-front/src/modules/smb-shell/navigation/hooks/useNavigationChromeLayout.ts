import { getNavigationChromeLayout } from '@/smb-shell/navigation/utils/getNavigationChromeLayout';
import { layoutModeState } from '@/smb-ui-preferences/states/layoutModeState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useNavigationChromeLayout = () => {
  const layoutMode = useAtomStateValue(layoutModeState);

  return getNavigationChromeLayout(layoutMode);
};
