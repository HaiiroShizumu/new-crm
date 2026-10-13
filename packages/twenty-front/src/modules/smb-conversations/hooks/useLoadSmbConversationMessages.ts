import { useStore } from 'jotai';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { SMB_CONVERSATION_MESSAGES_PAGE_SIZE } from '@/smb-conversations/constants/SmbConversationMessagesPageSize';
import { GET_SMB_CONVERSATION_MESSAGES } from '@/smb-conversations/graphql/queries/getSmbConversationMessages';
import { smbConversationMessagePageFamilyState } from '@/smb-conversations/states/smbConversationMessagePageFamilyState';
import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { upsertSmbConversationMessages } from '@/smb-conversations/utils/upsertSmbConversationMessages';

type SmbConversationMessagesQuery = {
  messengerMessages: { messages: SmbConversationMessage[]; hasMore: boolean };
};

type SmbConversationMessagesQueryVariables = {
  conversationId: string;
  beforeSeq?: number;
  afterSeq?: number;
  limit: number;
};

export const useLoadSmbConversationMessages = () => {
  const apolloClient = useApolloCoreClient();
  const store = useStore();

  const fetchMessages = useCallback(
    async (variables: SmbConversationMessagesQueryVariables) => {
      const { data } = await apolloClient.query<
        SmbConversationMessagesQuery,
        SmbConversationMessagesQueryVariables
      >({
        query: GET_SMB_CONVERSATION_MESSAGES,
        variables,
        fetchPolicy: 'no-cache',
      });

      return data?.messengerMessages;
    },
    [apolloClient],
  );

  const loadLatestSmbConversationMessages = useCallback(
    async (conversationId: string) => {
      const pageAtom =
        smbConversationMessagePageFamilyState.atomFamily(conversationId);

      // A link to a chat the user was removed from, or a mistyped one, ends here;
      // the conversation shows that instead of staying blank.
      const result = await fetchMessages({
        conversationId,
        limit: SMB_CONVERSATION_MESSAGES_PAGE_SIZE,
      }).catch(() => undefined);

      if (!isDefined(result)) {
        store.set(pageAtom, (page) => ({ ...page, hasFailedToLoad: true }));

        return;
      }

      // Events may have arrived while the request was in flight; merge, do not overwrite.
      store.set(pageAtom, (page) => ({
        messages: upsertSmbConversationMessages(page.messages, result.messages),
        hasMore: result.hasMore,
        isLoaded: true,
        hasFailedToLoad: false,
      }));
    },
    [fetchMessages, store],
  );

  const loadOlderSmbConversationMessages = useCallback(
    async (conversationId: string) => {
      const pageAtom =
        smbConversationMessagePageFamilyState.atomFamily(conversationId);
      const page = store.get(pageAtom);
      const oldestMessage = page.messages[0];

      if (!page.hasMore || !isDefined(oldestMessage)) {
        return;
      }

      const result = await fetchMessages({
        conversationId,
        beforeSeq: oldestMessage.seq,
        limit: SMB_CONVERSATION_MESSAGES_PAGE_SIZE,
      });

      if (!isDefined(result)) {
        return;
      }

      store.set(pageAtom, (currentPage) => ({
        ...currentPage,
        messages: upsertSmbConversationMessages(
          currentPage.messages,
          result.messages,
        ),
        hasMore: result.hasMore,
      }));
    },
    [fetchMessages, store],
  );

  // After a dropped connection the live stream has a gap. seq is contiguous,
  // so reading forward from the last known message closes it exactly.
  const loadMissedSmbConversationMessages = useCallback(
    async (conversationId: string) => {
      const pageAtom =
        smbConversationMessagePageFamilyState.atomFamily(conversationId);

      if (!store.get(pageAtom).isLoaded) {
        return;
      }

      let hasMore = true;

      while (hasMore) {
        const newestMessage = store.get(pageAtom).messages.at(-1);

        const result = await fetchMessages({
          conversationId,
          afterSeq: newestMessage?.seq ?? 0,
          limit: SMB_CONVERSATION_MESSAGES_PAGE_SIZE,
        });

        if (!isDefined(result) || result.messages.length === 0) {
          return;
        }

        store.set(pageAtom, (page) => ({
          ...page,
          messages: upsertSmbConversationMessages(
            page.messages,
            result.messages,
          ),
        }));

        hasMore = result.hasMore;
      }
    },
    [fetchMessages, store],
  );

  return {
    loadLatestSmbConversationMessages,
    loadOlderSmbConversationMessages,
    loadMissedSmbConversationMessages,
  };
};
