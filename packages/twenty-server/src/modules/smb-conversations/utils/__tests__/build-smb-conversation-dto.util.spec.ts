import { type SmbConversationRow } from 'src/modules/smb-conversations/types/smb-conversation-row.type';
import { type SmbConversationMemberRow } from 'src/modules/smb-conversations/types/smb-conversation-member-row.type';
import { SmbConversationKind } from 'src/modules/smb-conversations/enums/smb-conversation-kind.enum';
import { buildSmbConversationDto } from 'src/modules/smb-conversations/utils/build-smb-conversation-dto.util';

const VIEWER_ID = '20202020-0687-4c41-b707-ed1bfca972a7';
const COLLEAGUE_ID = '20202020-77d5-4cb6-b60a-f4a835a85d61';

const conversation = {
  id: 'conversation-id',
  kind: SmbConversationKind.DIRECT,
  name: null,
  lastSeq: 12,
  lastMessageAt: new Date('2026-10-12T10:00:00Z'),
  createdAt: new Date('2026-10-01T10:00:00Z'),
} as SmbConversationRow;

const member = (
  workspaceMemberId: string,
  lastReadSeq: number,
): SmbConversationMemberRow =>
  ({
    workspaceMemberId,
    lastReadSeq,
    mutedUntil: null,
  }) as SmbConversationMemberRow;

describe('buildSmbConversationDto', () => {
  it('counts unread messages from the viewer read position, not from other members', () => {
    const dto = buildSmbConversationDto({
      conversation,
      members: [member(VIEWER_ID, 9), member(COLLEAGUE_ID, 12)],
      viewerWorkspaceMemberId: VIEWER_ID,
      lastMessage: null,
    });

    expect(dto.lastReadSeq).toBe(9);
    expect(dto.unreadCount).toBe(3);
  });

  it('never reports a negative unread count', () => {
    const dto = buildSmbConversationDto({
      conversation: { ...conversation, lastSeq: 2 } as SmbConversationRow,
      members: [member(VIEWER_ID, 5)],
      viewerWorkspaceMemberId: VIEWER_ID,
      lastMessage: null,
    });

    expect(dto.unreadCount).toBe(0);
  });

  it('exposes every member read position for read receipts', () => {
    const dto = buildSmbConversationDto({
      conversation,
      members: [member(VIEWER_ID, 9), member(COLLEAGUE_ID, 12)],
      viewerWorkspaceMemberId: VIEWER_ID,
      lastMessage: null,
    });

    expect(dto.members).toEqual([
      { workspaceMemberId: VIEWER_ID, lastReadSeq: 9 },
      { workspaceMemberId: COLLEAGUE_ID, lastReadSeq: 12 },
    ]);
  });
});
