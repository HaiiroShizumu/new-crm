import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';

// History arrives from pages, catch-up reads and live events, in any order and
// with overlaps. Merging by id and sorting by seq makes every source safe to apply twice.
export const upsertSmbConversationMessages = (
  messages: SmbConversationMessage[],
  incomingMessages: SmbConversationMessage[],
): SmbConversationMessage[] => {
  const messageById = new Map(messages.map((message) => [message.id, message]));

  incomingMessages.forEach((message) => messageById.set(message.id, message));

  return [...messageById.values()].sort(
    (first, second) => first.seq - second.seq,
  );
};
