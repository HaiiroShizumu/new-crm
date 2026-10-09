import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbChromeTitleHostState = createAtomState<HTMLElement | null>({
  key: 'smb.chromeTitleHost',
  defaultValue: null,
});
