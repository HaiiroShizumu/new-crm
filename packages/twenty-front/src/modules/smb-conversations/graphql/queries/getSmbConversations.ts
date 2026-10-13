import { gql } from '@apollo/client';

import { SMB_CONVERSATION_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationFragment';

export const GET_SMB_CONVERSATIONS = gql`
  ${SMB_CONVERSATION_FRAGMENT}
  query GetSmbConversations {
    messengerConversations {
      ...SmbConversationFragment
    }
  }
`;
