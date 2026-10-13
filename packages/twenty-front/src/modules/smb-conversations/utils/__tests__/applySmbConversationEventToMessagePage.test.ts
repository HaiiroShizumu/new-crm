import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { type SmbConversationMessagePage } from '@/smb-conversations/types/SmbConversationMessagePage';
import { applySmbConversationEventToMessagePage } from '@/smb-conversations/utils/applySmbConversationEventToMessagePage';

const message = (
  seq: number,
  text = `message ${seq}`,
): SmbConversationMessage => ({
  id: `message-${seq}`,
  conversationId: 'conversation-a',
  seq,
  kind: 'TEXT',
  authorWorkspaceMemberId: 'member',
  body: null,
  text,
  clientMessageId: `client-${seq}`,
  createdAt: '2026-10-12T12:00:00.000Z',
  editedAt: null,
  deletedAt: null,
});

const loadedPage: SmbConversationMessagePage = {
  messages: [message(1), message(2)],
  hasMore: false,
  isLoaded: true,
  hasFailedToLoad: false,
};

describe('applySmbConversationEventToMessagePage', () => {
  it('appends a new message in seq order', () => {
    const page = applySmbConversationEventToMessagePage(loadedPage, {
      type: 'MESSAGE_CREATED',
      message: message(3),
    });

    expect(page.messages.map(({ seq }) => seq)).toEqual([1, 2, 3]);
  });

  it('places an event that arrives late where its seq belongs', () => {
    const page = applySmbConversationEventToMessagePage(
      { ...loadedPage, messages: [message(1), message(3)] },
      { type: 'MESSAGE_CREATED', message: message(2) },
    );

    expect(page.messages.map(({ seq }) => seq)).toEqual([1, 2, 3]);
  });

  it('does not duplicate a message delivered twice', () => {
    const page = applySmbConversationEventToMessagePage(loadedPage, {
      type: 'MESSAGE_CREATED',
      message: message(2),
    });

    expect(page.messages).toHaveLength(2);
  });

  it('replaces the content of an edited message', () => {
    const page = applySmbConversationEventToMessagePage(loadedPage, {
      type: 'MESSAGE_UPDATED',
      message: message(2, 'edited'),
    });

    expect(page.messages[1].text).toBe('edited');
  });

  it('leaves a never-opened conversation empty', () => {
    const emptyPage = {
      messages: [],
      hasMore: false,
      isLoaded: false,
      hasFailedToLoad: false,
    };

    expect(
      applySmbConversationEventToMessagePage(emptyPage, {
        type: 'MESSAGE_CREATED',
        message: message(9),
      }),
    ).toBe(emptyPage);
  });
});
