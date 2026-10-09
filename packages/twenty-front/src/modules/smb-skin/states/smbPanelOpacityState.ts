import { SMB_DEFAULT_PANEL_OPACITY } from '@/smb-skin/constants/SmbDefaultPanelOpacity';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbPanelOpacityState = createAtomState<number>({
  key: 'smb.panelOpacity',
  defaultValue: SMB_DEFAULT_PANEL_OPACITY,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
