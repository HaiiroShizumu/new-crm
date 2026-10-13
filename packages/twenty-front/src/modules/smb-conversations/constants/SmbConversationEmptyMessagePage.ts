import { type SmbConversationMessagePage } from '@/smb-conversations/types/SmbConversationMessagePage';

export const SMB_CONVERSATION_EMPTY_MESSAGE_PAGE: SmbConversationMessagePage = {
  messages: [],
  hasMore: false,
  isLoaded: false,
  hasFailedToLoad: false,
};
