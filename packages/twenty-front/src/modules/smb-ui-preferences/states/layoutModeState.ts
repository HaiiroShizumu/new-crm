import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

import {
  DEFAULT_LAYOUT_MODE,
  isLayoutMode,
  type LayoutMode,
} from '@/smb-ui-preferences/types/LayoutMode';

export const layoutModeState = createAtomState<LayoutMode>({
  key: 'uiPreferences.layoutMode',
  defaultValue: DEFAULT_LAYOUT_MODE,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: isLayoutMode,
});
