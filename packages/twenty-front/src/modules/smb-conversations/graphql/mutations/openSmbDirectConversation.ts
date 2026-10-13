import { gql } from '@apollo/client';

import { SMB_CONVERSATION_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationFragment';

export const OPEN_SMB_DIRECT_CONVERSATION = gql`
  ${SMB_CONVERSATION_FRAGMENT}
  mutation OpenSmbDirectConversation($colleagueWorkspaceMemberId: UUID!) {
    openMessengerDirectConversation(
      colleagueWorkspaceMemberId: $colleagueWorkspaceMemberId
    ) {
      ...SmbConversationFragment
    }
  }
`;
