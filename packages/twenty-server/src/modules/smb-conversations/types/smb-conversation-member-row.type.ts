import { type SmbConversationMemberRole } from 'src/modules/smb-conversations/types/smb-conversation-member-role.type';

export type SmbConversationMemberRow = {
  id: string;
  workspaceId: string;
  conversationId: string;
  workspaceMemberId: string;
  role: SmbConversationMemberRole;
  lastReadSeq: number;
  mutedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
