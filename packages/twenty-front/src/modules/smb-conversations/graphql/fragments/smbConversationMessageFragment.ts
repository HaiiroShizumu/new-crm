import { gql } from '@apollo/client';

export const SMB_CONVERSATION_MESSAGE_FRAGMENT = gql`
  fragment SmbConversationMessageFragment on SmbConversationMessage {
    id
    conversationId
    seq
    kind
    authorWorkspaceMemberId
    body
    text
    clientMessageId
    createdAt
    editedAt
    deletedAt
  }
`;
