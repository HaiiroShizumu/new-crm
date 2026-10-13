import { type JSONContent } from '@tiptap/react';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { SEND_SMB_CONVERSATION_MESSAGE } from '@/smb-conversations/graphql/mutations/sendSmbConversationMessage';
import { smbConversationMessagePageFamilyState } from '@/smb-conversations/states/smbConversationMessagePageFamilyState';
import { smbConversationPendingMessagesFamilyState } from '@/smb-conversations/states/smbConversationPendingMessagesFamilyState';
import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { type SmbConversationPendingMessage } from '@/smb-conversations/types/SmbConversationPendingMessage';
import { upsertSmbConversationMessages } from '@/smb-conversations/utils/upsertSmbConversationMessages';

export const useSendSmbConversationMessage = (conversationId: string) => {
  const apolloClient = useApolloCoreClient();
  const store = useStore();

  const deliver = useCallback(
    async (pendingMessage: SmbConversationPendingMessage) => {
      const pendingAtom =
        smbConversationPendingMessagesFamilyState.atomFamily(conversationId);
      const pageAtom =
        smbConversationMessagePageFamilyState.atomFamily(conversationId);

      const setStatus = (status: SmbConversationPendingMessage['status']) =>
        store.set(pendingAtom, (pendingMessages) =>
          pendingMessages.map((message) =>
            message.clientMessageId === pendingMessage.clientMessageId
              ? { ...message, status }
              : message,
          ),
        );

      try {
        const { data } = await apolloClient.mutate<{
          sendMessengerMessage: SmbConversationMessage;
        }>({
          mutation: SEND_SMB_CONVERSATION_MESSAGE,
          variables: {
            input: {
              conversationId,
              clientMessageId: pendingMessage.clientMessageId,
              body: pendingMessage.body,
            },
          },
        });

        const sentMessage = data?.sendMessengerMessage;

        if (!isDefined(sentMessage)) {
          setStatus('failed');

          return;
        }

        store.set(pageAtom, (page) => ({
          ...page,
          messages: upsertSmbConversationMessages(page.messages, [sentMessage]),
        }));
        store.set(pendingAtom, (pendingMessages) =>
          pendingMessages.filter(
            (message) =>
              message.clientMessageId !== pendingMessage.clientMessageId,
          ),
        );
      } catch {
        // The message stays in the list marked as failed, with its own retry;
        // the same clientMessageId makes the retry safe even if the first attempt did reach the server.
        setStatus('failed');
      }
    },
    [apolloClient, conversationId, store],
  );

  const sendSmbConversationMessage = useCallback(
    ({ body, text }: { body: JSONContent; text: string }) => {
      const pendingMessage: SmbConversationPendingMessage = {
        clientMessageId: v4(),
        body,
        text,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      store.set(
        smbConversationPendingMessagesFamilyState.atomFamily(conversationId),
        (pendingMessages) => [...pendingMessages, pendingMessage],
      );

      void deliver(pendingMessage);
    },
    [conversationId, deliver, store],
  );

  const retrySmbConversationMessage = useCallback(
    (clientMessageId: string) => {
      const pendingAtom =
        smbConversationPendingMessagesFamilyState.atomFamily(conversationId);
      const pendingMessage = store
        .get(pendingAtom)
        .find((message) => message.clientMessageId === clientMessageId);

      if (!isDefined(pendingMessage)) {
        return;
      }

      const retriedMessage = { ...pendingMessage, status: 'sending' as const };

      store.set(pendingAtom, (pendingMessages) =>
        pendingMessages.map((message) =>
          message.clientMessageId === clientMessageId
            ? retriedMessage
            : message,
        ),
      );

      void deliver(retriedMessage);
    },
    [conversationId, deliver, store],
  );

  return { sendSmbConversationMessage, retrySmbConversationMessage };
};
