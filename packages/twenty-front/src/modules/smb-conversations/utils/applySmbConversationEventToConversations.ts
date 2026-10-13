import { isDefined } from 'twenty-shared/utils';

import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { type SmbConversationEvent } from '@/smb-conversations/types/SmbConversationEvent';
import { sortSmbConversations } from '@/smb-conversations/utils/sortSmbConversations';

const withReadPosition = (
  conversation: SmbConversation,
  lastReadSeq: number,
): SmbConversation => ({
  ...conversation,
  lastReadSeq,
  unreadCount: Math.max(conversation.lastSeq - lastReadSeq, 0),
});

export const applySmbConversationEventToConversations = ({
  conversations,
  event,
  currentWorkspaceMemberId,
}: {
  conversations: SmbConversation[];
  event: SmbConversationEvent;
  currentWorkspaceMemberId: string;
}): SmbConversation[] => {
  if (event.type === 'CONVERSATION_UPDATED' && isDefined(event.conversation)) {
    const updatedConversation = event.conversation;

    return sortSmbConversations([
      ...conversations.filter(
        (conversation) => conversation.id !== updatedConversation.id,
      ),
      updatedConversation,
    ]);
  }

  const mapConversation = (
    update: (conversation: SmbConversation) => SmbConversation,
  ): SmbConversation[] =>
    conversations.map((conversation) =>
      conversation.id === event.conversationId
        ? update(conversation)
        : conversation,
    );

  if (event.type === 'MESSAGE_CREATED' && isDefined(event.message)) {
    const message = event.message;

    return sortSmbConversations(
      mapConversation((conversation) => {
        // A replayed event must not move the conversation backwards.
        if (message.seq <= conversation.lastSeq) {
          return conversation;
        }

        const receivedConversation = {
          ...conversation,
          lastSeq: message.seq,
          lastMessage: message,
          lastMessageAt: message.createdAt,
        };

        // Sending a message marks everything before it as read, on the server too.
        return withReadPosition(
          receivedConversation,
          message.authorWorkspaceMemberId === currentWorkspaceMemberId
            ? message.seq
            : conversation.lastReadSeq,
        );
      }),
    );
  }

  if (
    (event.type === 'MESSAGE_UPDATED' || event.type === 'MESSAGE_DELETED') &&
    isDefined(event.message)
  ) {
    const message = event.message;

    return mapConversation((conversation) =>
      conversation.lastMessage?.id === message.id
        ? { ...conversation, lastMessage: message }
        : conversation,
    );
  }

  if (
    event.type === 'CONVERSATION_READ' &&
    isDefined(event.workspaceMemberId) &&
    isDefined(event.lastReadSeq)
  ) {
    const readerWorkspaceMemberId = event.workspaceMemberId;
    const lastReadSeq = event.lastReadSeq;

    return mapConversation((conversation) => {
      const conversationWithReceipt = {
        ...conversation,
        members: conversation.members.map((member) =>
          member.workspaceMemberId === readerWorkspaceMemberId
            ? { ...member, lastReadSeq }
            : member,
        ),
      };

      // The reader may be this user in another tab.
      return readerWorkspaceMemberId === currentWorkspaceMemberId
        ? withReadPosition(
            conversationWithReceipt,
            Math.max(conversation.lastReadSeq, lastReadSeq),
          )
        : conversationWithReceipt;
    });
  }

  return conversations;
};
