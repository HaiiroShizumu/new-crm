import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { applySmbConversationEventToConversations } from '@/smb-conversations/utils/applySmbConversationEventToConversations';

const ME = 'member-me';
const COLLEAGUE = 'member-colleague';

const message = (
  overrides: Partial<SmbConversationMessage> = {},
): SmbConversationMessage => ({
  id: 'message-6',
  conversationId: 'conversation-a',
  seq: 6,
  kind: 'TEXT',
  authorWorkspaceMemberId: COLLEAGUE,
  body: null,
  text: 'Hello',
  clientMessageId: 'client-6',
  createdAt: '2026-10-12T12:00:00.000Z',
  editedAt: null,
  deletedAt: null,
  ...overrides,
});

const conversation = (
  overrides: Partial<SmbConversation> = {},
): SmbConversation => ({
  id: 'conversation-a',
  kind: 'DIRECT',
  name: null,
  members: [
    { workspaceMemberId: ME, lastReadSeq: 5 },
    { workspaceMemberId: COLLEAGUE, lastReadSeq: 5 },
  ],
  lastSeq: 5,
  lastReadSeq: 5,
  unreadCount: 0,
  lastMessage: null,
  lastMessageAt: '2026-10-12T10:00:00.000Z',
  mutedUntil: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  ...overrides,
});

describe('applySmbConversationEventToConversations', () => {
  it('adds one unread and shows the preview when a colleague writes', () => {
    const [updated] = applySmbConversationEventToConversations({
      conversations: [conversation()],
      event: {
        type: 'MESSAGE_CREATED',
        conversationId: 'conversation-a',
        message: message(),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated.unreadCount).toBe(1);
    expect(updated.lastMessage?.text).toBe('Hello');
  });

  it('keeps unread at zero for a message the user sent themselves', () => {
    const [updated] = applySmbConversationEventToConversations({
      conversations: [conversation({ lastReadSeq: 3, unreadCount: 2 })],
      event: {
        type: 'MESSAGE_CREATED',
        conversationId: 'conversation-a',
        message: message({ authorWorkspaceMemberId: ME }),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated.unreadCount).toBe(0);
    expect(updated.lastReadSeq).toBe(6);
  });

  it('ignores a replayed message so the counter is not inflated', () => {
    const conversations = [conversation({ lastSeq: 6, unreadCount: 1 })];

    const [updated] = applySmbConversationEventToConversations({
      conversations,
      event: {
        type: 'MESSAGE_CREATED',
        conversationId: 'conversation-a',
        message: message(),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated).toEqual(conversations[0]);
  });

  it('moves the conversation with the newest message to the top', () => {
    const result = applySmbConversationEventToConversations({
      conversations: [
        conversation({
          id: 'conversation-b',
          lastMessageAt: '2026-10-12T11:00:00.000Z',
        }),
        conversation(),
      ],
      event: {
        type: 'MESSAGE_CREATED',
        conversationId: 'conversation-a',
        message: message(),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(result.map(({ id }) => id)).toEqual([
      'conversation-a',
      'conversation-b',
    ]);
  });

  it('clears unread when the user reads the conversation in another tab', () => {
    const [updated] = applySmbConversationEventToConversations({
      conversations: [conversation({ lastSeq: 8, unreadCount: 3 })],
      event: {
        type: 'CONVERSATION_READ',
        conversationId: 'conversation-a',
        workspaceMemberId: ME,
        lastReadSeq: 8,
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated.unreadCount).toBe(0);
  });

  it('records a colleague read receipt without touching the user unread count', () => {
    const [updated] = applySmbConversationEventToConversations({
      conversations: [conversation({ lastSeq: 8, unreadCount: 3 })],
      event: {
        type: 'CONVERSATION_READ',
        conversationId: 'conversation-a',
        workspaceMemberId: COLLEAGUE,
        lastReadSeq: 8,
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated.unreadCount).toBe(3);
    expect(
      updated.members.find((member) => member.workspaceMemberId === COLLEAGUE)
        ?.lastReadSeq,
    ).toBe(8);
  });

  it('adds a conversation the user was just invited to', () => {
    const result = applySmbConversationEventToConversations({
      conversations: [conversation()],
      event: {
        type: 'CONVERSATION_UPDATED',
        conversationId: 'conversation-new',
        conversation: conversation({
          id: 'conversation-new',
          createdAt: '2026-10-12T13:00:00.000Z',
          lastMessageAt: null,
        }),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(result.map(({ id }) => id)).toEqual([
      'conversation-new',
      'conversation-a',
    ]);
  });

  it('replaces the preview when the last message is deleted', () => {
    const [updated] = applySmbConversationEventToConversations({
      conversations: [conversation({ lastSeq: 6, lastMessage: message() })],
      event: {
        type: 'MESSAGE_DELETED',
        conversationId: 'conversation-a',
        message: message({ text: '', deletedAt: '2026-10-12T12:05:00.000Z' }),
      },
      currentWorkspaceMemberId: ME,
    });

    expect(updated.lastMessage?.deletedAt).toBe('2026-10-12T12:05:00.000Z');
  });
});
