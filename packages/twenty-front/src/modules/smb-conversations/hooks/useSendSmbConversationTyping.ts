import { useThrottledCallback } from 'use-debounce';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { SMB_CONVERSATION_TYPING_THROTTLE_MS } from '@/smb-conversations/constants/SmbConversationTypingThrottleMs';
import { SEND_SMB_CONVERSATION_TYPING } from '@/smb-conversations/graphql/mutations/sendSmbConversationTyping';

export const useSendSmbConversationTyping = (conversationId: string) => {
  const apolloClient = useApolloCoreClient();

  const sendSmbConversationTyping = useThrottledCallback(
    () => {
      // A lost typing signal has no consequence worth surfacing to the user.
      void apolloClient
        .mutate({
          mutation: SEND_SMB_CONVERSATION_TYPING,
          variables: { conversationId },
        })
        .catch(() => undefined);
    },
    SMB_CONVERSATION_TYPING_THROTTLE_MS,
    { trailing: false },
  );

  return { sendSmbConversationTyping };
};
