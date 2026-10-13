import { isDefined } from 'twenty-shared/utils';

import { type SmbConversationDTO } from 'src/modules/smb-conversations/dtos/smb-conversation.dto';
import { type SmbConversationRow } from 'src/modules/smb-conversations/types/smb-conversation-row.type';
import { type SmbConversationMemberRow } from 'src/modules/smb-conversations/types/smb-conversation-member-row.type';
import { type SmbConversationMessageRow } from 'src/modules/smb-conversations/types/smb-conversation-message-row.type';
import { fromSmbConversationMessageRowToDto } from 'src/modules/smb-conversations/utils/from-smb-conversation-message-row-to-dto.util';

// A conversation is always rendered for one viewer: read position, unread count and mute are theirs.
export const buildSmbConversationDto = ({
  conversation,
  members,
  viewerWorkspaceMemberId,
  lastMessage,
}: {
  conversation: SmbConversationRow;
  members: SmbConversationMemberRow[];
  viewerWorkspaceMemberId: string;
  lastMessage: SmbConversationMessageRow | null;
}): SmbConversationDTO => {
  const viewer = members.find(
    (member) => member.workspaceMemberId === viewerWorkspaceMemberId,
  );
  const lastReadSeq = viewer?.lastReadSeq ?? 0;

  return {
    id: conversation.id,
    kind: conversation.kind,
    name: conversation.name,
    members: members.map((member) => ({
      workspaceMemberId: member.workspaceMemberId,
      lastReadSeq: member.lastReadSeq,
    })),
    lastSeq: conversation.lastSeq,
    lastReadSeq,
    unreadCount: Math.max(conversation.lastSeq - lastReadSeq, 0),
    lastMessage: isDefined(lastMessage)
      ? fromSmbConversationMessageRowToDto(lastMessage)
      : null,
    lastMessageAt: conversation.lastMessageAt,
    mutedUntil: viewer?.mutedUntil ?? null,
    createdAt: conversation.createdAt,
  };
};
