import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';

const getActivityTime = (conversation: SmbConversation) =>
  new Date(conversation.lastMessageAt ?? conversation.createdAt).getTime();

export const sortSmbConversations = (
  conversations: SmbConversation[],
): SmbConversation[] =>
  [...conversations].sort(
    (first, second) => getActivityTime(second) - getActivityTime(first),
  );
