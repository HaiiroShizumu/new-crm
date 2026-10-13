import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';

export type SmbConversationEvent = {
  type:
    | 'KEEPALIVE'
    | 'MESSAGE_CREATED'
    | 'MESSAGE_UPDATED'
    | 'MESSAGE_DELETED'
    | 'CONVERSATION_UPDATED'
    | 'CONVERSATION_READ'
    | 'TYPING';
  conversationId?: string | null;
  workspaceMemberId?: string | null;
  message?: SmbConversationMessage | null;
  conversation?: SmbConversation | null;
  lastReadSeq?: number | null;
};
