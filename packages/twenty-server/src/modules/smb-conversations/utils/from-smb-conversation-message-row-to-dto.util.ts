import { type SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';
import { type SmbConversationMessageRow } from 'src/modules/smb-conversations/types/smb-conversation-message-row.type';

export const fromSmbConversationMessageRowToDto = (
  message: SmbConversationMessageRow,
): SmbConversationMessageDTO => ({
  id: message.id,
  conversationId: message.conversationId,
  seq: message.seq,
  kind: message.kind,
  authorWorkspaceMemberId: message.authorWorkspaceMemberId,
  body: message.body,
  text: message.text,
  clientMessageId: message.clientMessageId,
  createdAt: message.createdAt,
  editedAt: message.editedAt,
  deletedAt: message.deletedAt,
});
