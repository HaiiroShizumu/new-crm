import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbChromeActionsHostState = createAtomState<HTMLElement | null>({
  key: 'smb.chromeActionsHost',
  defaultValue: null,
});
