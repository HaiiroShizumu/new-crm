import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbPanelFramesState = createAtomState<boolean>({
  key: 'smb.panelFrames',
  defaultValue: false,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
