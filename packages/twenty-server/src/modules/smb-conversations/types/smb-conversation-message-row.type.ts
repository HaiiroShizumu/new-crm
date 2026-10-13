import { type SmbConversationMessageKind } from 'src/modules/smb-conversations/enums/smb-conversation-message-kind.enum';
import { type SmbConversationMessageBody } from 'src/modules/smb-conversations/types/smb-conversation-message-body.type';

export type SmbConversationMessageRow = {
  id: string;
  workspaceId: string;
  conversationId: string;
  seq: number;
  kind: SmbConversationMessageKind;
  authorWorkspaceMemberId: string | null;
  body: SmbConversationMessageBody | null;
  text: string;
  clientMessageId: string;
  replyToMessageId: string | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
};
