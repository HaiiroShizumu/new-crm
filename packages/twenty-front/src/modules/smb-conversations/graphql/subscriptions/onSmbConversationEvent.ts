import { gql } from '@apollo/client';

import { SMB_CONVERSATION_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationFragment';

export const ON_SMB_CONVERSATION_EVENT = gql`
  ${SMB_CONVERSATION_FRAGMENT}
  subscription OnSmbConversationEvent {
    onMessengerEvent {
      type
      conversationId
      workspaceMemberId
      lastReadSeq
      message {
        ...SmbConversationMessageFragment
      }
      conversation {
        ...SmbConversationFragment
      }
    }
  }
`;
