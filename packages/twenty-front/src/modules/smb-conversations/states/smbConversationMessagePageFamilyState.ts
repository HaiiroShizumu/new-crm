import { SMB_CONVERSATION_EMPTY_MESSAGE_PAGE } from '@/smb-conversations/constants/SmbConversationEmptyMessagePage';
import { type SmbConversationMessagePage } from '@/smb-conversations/types/SmbConversationMessagePage';
import { createAtomFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomFamilyState';

export const smbConversationMessagePageFamilyState = createAtomFamilyState<
  SmbConversationMessagePage,
  string
>({
  key: 'smbConversationMessagePageFamilyState',
  defaultValue: SMB_CONVERSATION_EMPTY_MESSAGE_PAGE,
});
