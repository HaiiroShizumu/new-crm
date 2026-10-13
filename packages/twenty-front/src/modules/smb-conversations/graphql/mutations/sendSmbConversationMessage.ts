import { gql } from '@apollo/client';

import { SMB_CONVERSATION_MESSAGE_FRAGMENT } from '@/smb-conversations/graphql/fragments/smbConversationMessageFragment';

export const SEND_SMB_CONVERSATION_MESSAGE = gql`
  ${SMB_CONVERSATION_MESSAGE_FRAGMENT}
  mutation SendSmbConversationMessage(
    $input: SendSmbConversationMessageInput!
  ) {
    sendMessengerMessage(input: $input) {
      ...SmbConversationMessageFragment
    }
  }
`;
