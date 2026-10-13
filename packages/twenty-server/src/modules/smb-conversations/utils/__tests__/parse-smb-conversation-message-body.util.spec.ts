import { SMB_CONVERSATION_MESSAGE_MAX_TEXT_LENGTH } from 'src/modules/smb-conversations/constants/smb-conversation-message-max-text-length.constant';
import { SmbConversationsException } from 'src/modules/smb-conversations/smb-conversations.exception';
import { parseSmbConversationMessageBody } from 'src/modules/smb-conversations/utils/parse-smb-conversation-message-body.util';

const MEMBER_ID = '20202020-0687-4c41-b707-ed1bfca972a7';

const paragraph = (...content: unknown[]) => ({ type: 'paragraph', content });
const text = (value: string) => ({ type: 'text', text: value });

describe('parseSmbConversationMessageBody', () => {
  it('derives plain text from paragraphs and hard breaks', () => {
    const result = parseSmbConversationMessageBody({
      type: 'doc',
      content: [
        paragraph(text('Hello'), { type: 'hardBreak' }, text('there')),
        paragraph(text('Second')),
      ],
    });

    expect(result.text).toBe('Hello\nthere\nSecond');
    expect(result.mentionedWorkspaceMemberIds).toEqual([]);
  });

  it('collects each mentioned workspace member once', () => {
    const mention = {
      type: 'mentionTag',
      attrs: {
        recordId: MEMBER_ID,
        objectNameSingular: 'workspaceMember',
        label: 'Tim',
      },
    };

    const result = parseSmbConversationMessageBody({
      type: 'doc',
      content: [paragraph(mention, text(' and again '), mention)],
    });

    expect(result.text).toBe('@Tim and again @Tim');
    expect(result.mentionedWorkspaceMemberIds).toEqual([MEMBER_ID]);
  });

  it('keeps a mention of another record as text without notifying anyone', () => {
    const result = parseSmbConversationMessageBody({
      type: 'doc',
      content: [
        paragraph({
          type: 'mentionTag',
          attrs: {
            recordId: MEMBER_ID,
            objectNameSingular: 'company',
            label: 'Acme',
          },
        }),
      ],
    });

    expect(result.text).toBe('@Acme');
    expect(result.mentionedWorkspaceMemberIds).toEqual([]);
  });

  it.each([
    ['a non-doc root', paragraph(text('Hello'))],
    [
      'a whitespace-only message',
      { type: 'doc', content: [paragraph(text('   '))] },
    ],
    [
      'a text node without text',
      { type: 'doc', content: [paragraph({ type: 'text' })] },
    ],
    [
      'a mention without a valid member id',
      {
        type: 'doc',
        content: [
          paragraph({
            type: 'mentionTag',
            attrs: { recordId: 'nope', objectNameSingular: 'workspaceMember' },
          }),
        ],
      },
    ],
    [
      'a message above the length limit',
      {
        type: 'doc',
        content: [
          paragraph(
            text('a'.repeat(SMB_CONVERSATION_MESSAGE_MAX_TEXT_LENGTH + 1)),
          ),
        ],
      },
    ],
    ['a non-object body', 'Hello'],
  ])('rejects %s', (_label, body) => {
    expect(() => parseSmbConversationMessageBody(body)).toThrow(
      SmbConversationsException,
    );
  });

  it('rejects a body nested deeper than the limit', () => {
    const nested = Array.from({ length: 20 }).reduce<unknown>(
      (child) => ({ type: 'blockquote', content: [child] }),
      paragraph(text('deep')),
    );

    expect(() =>
      parseSmbConversationMessageBody({ type: 'doc', content: [nested] }),
    ).toThrow(SmbConversationsException);
  });
});
