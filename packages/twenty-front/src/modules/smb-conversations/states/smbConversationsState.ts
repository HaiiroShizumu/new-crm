import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbConversationsState = createAtomState<SmbConversation[]>({
  key: 'smbConversationsState',
  defaultValue: [],
});
