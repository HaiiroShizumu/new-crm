import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';

export type SmbConversationMessagePage = {
  messages: SmbConversationMessage[];
  hasMore: boolean;
  isLoaded: boolean;
  hasFailedToLoad: boolean;
};
