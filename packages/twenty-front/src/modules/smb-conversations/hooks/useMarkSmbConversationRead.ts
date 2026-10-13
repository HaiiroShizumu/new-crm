import { useStore } from 'jotai';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCallback } from 'react';

import { MARK_SMB_CONVERSATION_READ } from '@/smb-conversations/graphql/mutations/markSmbConversationRead';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';

export const useMarkSmbConversationRead = () => {
  const apolloClient = useApolloCoreClient();
  const store = useStore();

  const markSmbConversationRead = useCallback(
    async (conversationId: string) => {
      const conversation = store
        .get(smbConversationsState.atom)
        .find(({ id }) => id === conversationId);

      if (conversation === undefined || conversation.unreadCount === 0) {
        return;
      }

      const seq = conversation.lastSeq;

      // Clear the badge at once; the server answers with a CONVERSATION_READ event
      // that confirms it, and the next conversation load corrects it if the call failed.
      store.set(smbConversationsState.atom, (conversations) =>
        conversations.map((currentConversation) =>
          currentConversation.id === conversationId
            ? {
                ...currentConversation,
                lastReadSeq: Math.max(currentConversation.lastReadSeq, seq),
                unreadCount: Math.max(currentConversation.lastSeq - seq, 0),
              }
            : currentConversation,
        ),
      );

      await apolloClient.mutate({
        mutation: MARK_SMB_CONVERSATION_READ,
        variables: { conversationId, seq },
      });
    },
    [apolloClient, store],
  );

  return { markSmbConversationRead };
};
