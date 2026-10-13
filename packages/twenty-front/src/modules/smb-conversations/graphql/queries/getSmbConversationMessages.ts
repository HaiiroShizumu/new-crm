import { gql } from '@apollo/client';

import { SMB_CONVERSATION_MESSAGE_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationMessageFragment';

export const GET_SMB_CONVERSATION_MESSAGES = gql`
  ${SMB_CONVERSATION_MESSAGE_FRAGMENT}
  query GetSmbConversationMessages(
    $conversationId: UUID!
    $beforeSeq: Int
    $afterSeq: Int
    $limit: Int
  ) {
    messengerMessages(
      conversationId: $conversationId
      beforeSeq: $beforeSeq
      afterSeq: $afterSeq
      limit: $limit
    ) {
      messages {
        ...SmbConversationMessageFragment
      }
      hasMore
    }
  }
`;
