import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';

export type SmbConversationMember = {
  workspaceMemberId: string;
  lastReadSeq: number;
};

export type SmbConversation = {
  id: string;
  kind: 'DIRECT' | 'GROUP' | 'RECORD' | 'FEED_POST';
  name: string | null;
  members: SmbConversationMember[];
  lastSeq: number;
  lastReadSeq: number;
  unreadCount: number;
  lastMessage: SmbConversationMessage | null;
  lastMessageAt: string | null;
  mutedUntil: string | null;
  createdAt: string;
};
