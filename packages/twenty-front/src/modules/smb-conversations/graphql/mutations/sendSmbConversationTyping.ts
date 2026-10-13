import { gql } from '@apollo/client';

export const SEND_SMB_CONVERSATION_TYPING = gql`
  mutation SendSmbConversationTyping($conversationId: UUID!) {
    sendMessengerTyping(conversationId: $conversationId)
  }
`;
