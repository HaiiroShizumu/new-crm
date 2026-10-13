import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbChromeTopBarActionsHostState =
  createAtomState<HTMLElement | null>({
    key: 'smb.chromeTopBarActionsHost',
    defaultValue: null,
  });
