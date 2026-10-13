import { gql } from '@apollo/client';

import { SMB_CONVERSATION_MESSAGE_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationMessageFragment';

export const SMB_CONVERSATION_FRAGMENT = gql`
  ${SMB_CONVERSATION_MESSAGE_FRAGMENT}
  fragment SmbConversationFragment on SmbConversation {
    id
    kind
    name
    members {
      workspaceMemberId
      lastReadSeq
    }
    lastSeq
    lastReadSeq
    unreadCount
    lastMessage {
      ...SmbConversationMessageFragment
    }
    lastMessageAt
    mutedUntil
    createdAt
  }
`;
