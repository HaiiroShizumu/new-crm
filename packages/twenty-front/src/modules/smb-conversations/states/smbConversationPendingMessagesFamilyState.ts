import { type SmbConversationPendingMessage } from '@/smb-conversations/types/SmbConversationPendingMessage';
import { createAtomFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomFamilyState';

export const smbConversationPendingMessagesFamilyState = createAtomFamilyState<
  SmbConversationPendingMessage[],
  string
>({
  key: 'smbConversationPendingMessagesFamilyState',
  defaultValue: [],
});
