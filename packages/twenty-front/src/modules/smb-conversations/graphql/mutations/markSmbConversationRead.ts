import { gql } from '@apollo/client';

export const MARK_SMB_CONVERSATION_READ = gql`
  mutation MarkSmbConversationRead($conversationId: UUID!, $seq: Int) {
    markMessengerConversationAsRead(conversationId: $conversationId, seq: $seq)
  }
`;
