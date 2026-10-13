import { print, type ExecutionResult } from 'graphql';
import { createClient } from 'graphql-sse';
import { useStore } from 'jotai';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { ON_SMB_CONVERSATION_EVENT } from '@/smb-conversations/graphql/subscriptions/onSmbConversationEvent';
import { useLoadSmbConversations } from '@/smb-conversations/hooks/useLoadSmbConversations';
import { useLoadSmbConversationMessages } from '@/smb-conversations/hooks/useLoadSmbConversationMessages';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { smbConversationMessagePageFamilyState } from '@/smb-conversations/states/smbConversationMessagePageFamilyState';
import { smbConversationTypingFamilyState } from '@/smb-conversations/states/smbConversationTypingFamilyState';
import { type SmbConversationEvent } from '@/smb-conversations/types/SmbConversationEvent';
import { applySmbConversationEventToConversations } from '@/smb-conversations/utils/applySmbConversationEventToConversations';
import { applySmbConversationEventToMessagePage } from '@/smb-conversations/utils/applySmbConversationEventToMessagePage';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type SmbConversationEventPayload = { onMessengerEvent: SmbConversationEvent };

// Connects the live event stream to the messenger state. It subscribes to an
// external system, which is what an effect is for.
//
// The stream has its own SSE client: fork resolvers live in the core schema
// (/graphql, ADR-013 п.1), while the client shared by the rest of the app is
// bound to /metadata.
export const SmbConversationsRuntimeEffect = () => {
  const store = useStore();
  const currentWorkspaceMemberId = useAtomStateValue(
    currentWorkspaceMemberState,
  )?.id;
  const { loadSmbConversations } = useLoadSmbConversations();
  const { loadMissedSmbConversationMessages } =
    useLoadSmbConversationMessages();

  useEffect(() => {
    if (!isDefined(currentWorkspaceMemberId)) {
      return;
    }

    let isDisposed = false;

    const handleEvent = (event: SmbConversationEvent) => {
      if (event.type === 'KEEPALIVE') {
        return;
      }

      const conversationId = event.conversationId;

      if (event.type === 'TYPING') {
        if (isDefined(conversationId) && isDefined(event.workspaceMemberId)) {
          const typistWorkspaceMemberId = event.workspaceMemberId;

          store.set(
            smbConversationTypingFamilyState.atomFamily(conversationId),
            (typing) => ({
              ...typing,
              [typistWorkspaceMemberId]: Date.now(),
            }),
          );
        }

        return;
      }

      const isKnownConversation = store
        .get(smbConversationsState.atom)
        .some(({ id }) => id === conversationId);

      if (!isKnownConversation && event.type !== 'CONVERSATION_UPDATED') {
        // An event for a conversation missing from the list means the list is stale.
        void loadSmbConversations();

        return;
      }

      store.set(smbConversationsState.atom, (conversations) =>
        applySmbConversationEventToConversations({
          conversations,
          event,
          currentWorkspaceMemberId,
        }),
      );

      if (!isDefined(conversationId)) {
        return;
      }

      store.set(
        smbConversationMessagePageFamilyState.atomFamily(conversationId),
        (page) => applySmbConversationEventToMessagePage(page, event),
      );

      const authorWorkspaceMemberId = event.message?.authorWorkspaceMemberId;

      if (
        event.type === 'MESSAGE_CREATED' &&
        isDefined(authorWorkspaceMemberId)
      ) {
        store.set(
          smbConversationTypingFamilyState.atomFamily(conversationId),
          (typing) =>
            Object.fromEntries(
              Object.entries(typing).filter(
                ([workspaceMemberId]) =>
                  workspaceMemberId !== authorWorkspaceMemberId,
              ),
            ),
        );
      }
    };

    // Runs on the first connection and on every reconnection: whatever was
    // missed while the stream was down is fetched instead of assumed.
    const synchronize = async () => {
      const loadedConversationIds = store
        .get(smbConversationsState.atom)
        .map(({ id }) => id);

      await loadSmbConversations();
      await Promise.all(
        loadedConversationIds.map(loadMissedSmbConversationMessages),
      );
    };

    const sseClient = createClient({
      url: `${REACT_APP_SERVER_BASE_URL}/graphql`,
      credentials: 'include',
      retryAttempts: Infinity,
      on: {
        connected: () => {
          void synchronize().catch(() => undefined);
        },
      },
    });

    const unsubscribe = sseClient.subscribe<SmbConversationEventPayload>(
      { query: print(ON_SMB_CONVERSATION_EVENT) },
      {
        next: (value: ExecutionResult<SmbConversationEventPayload>) => {
          const event = value.data?.onMessengerEvent;

          if (!isDisposed && isDefined(event)) {
            handleEvent(event);
          }
        },
        // The client retries by itself; a fatal error leaves the page usable
        // through plain requests until it is reopened.
        error: () => {},
        complete: () => {},
      },
    );

    return () => {
      isDisposed = true;
      unsubscribe();
      sseClient.dispose();
    };
  }, [
    currentWorkspaceMemberId,
    loadMissedSmbConversationMessages,
    loadSmbConversations,
    store,
  ]);

  return null;
};
