import { isNonEmptyString, isString } from '@sniptt/guards';
import { isDefined, isPlainObject } from 'twenty-shared/utils';
import { validate as isUuid } from 'uuid';

import { SMB_CONVERSATION_MENTION_NODE_TYPE } from 'src/modules/smb-conversations/constants/smb-conversation-mention-node-type.constant';
import { SMB_CONVERSATION_MENTION_OBJECT_NAME_SINGULAR } from 'src/modules/smb-conversations/constants/smb-conversation-mention-object-name-singular.constant';
import { SMB_CONVERSATION_MESSAGE_MAX_BODY_BYTES } from 'src/modules/smb-conversations/constants/smb-conversation-message-max-body-bytes.constant';
import { SMB_CONVERSATION_MESSAGE_MAX_BODY_DEPTH } from 'src/modules/smb-conversations/constants/smb-conversation-message-max-body-depth.constant';
import { SMB_CONVERSATION_MESSAGE_MAX_TEXT_LENGTH } from 'src/modules/smb-conversations/constants/smb-conversation-message-max-text-length.constant';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';
import {
  type SmbConversationMessageBody,
  type SmbConversationMessageBodyNode,
} from 'src/modules/smb-conversations/types/smb-conversation-message-body.type';

type ParsedSmbConversationMessageBody = {
  body: SmbConversationMessageBody;
  text: string;
  mentionedWorkspaceMemberIds: string[];
};

const BLOCK_NODE_TYPES = new Set(['paragraph', 'heading', 'listItem']);

const invalidBody = (reason: string) =>
  new SmbConversationsException(
    `Invalid chat message body: ${reason}`,
    SmbConversationsExceptionCode.INVALID_MESSAGE_BODY,
  );

const isBodyNode = (value: unknown): value is SmbConversationMessageBodyNode =>
  isPlainObject(value) && isNonEmptyString(value.type);

// The text column feeds previews, search and notifications, so it is derived
// here rather than accepted from the client alongside the document.
export const parseSmbConversationMessageBody = (
  rawBody: unknown,
): ParsedSmbConversationMessageBody => {
  if (!isBodyNode(rawBody) || rawBody.type !== 'doc') {
    throw invalidBody('root node must be a doc');
  }

  if (
    Buffer.byteLength(JSON.stringify(rawBody), 'utf8') >
    SMB_CONVERSATION_MESSAGE_MAX_BODY_BYTES
  ) {
    throw invalidBody('body is too large');
  }

  const textParts: string[] = [];
  const mentionedWorkspaceMemberIds = new Set<string>();

  const visit = (node: unknown, depth: number) => {
    if (!isBodyNode(node)) {
      throw invalidBody('malformed node');
    }

    if (depth > SMB_CONVERSATION_MESSAGE_MAX_BODY_DEPTH) {
      throw invalidBody('body is nested too deeply');
    }

    if (node.type === 'text') {
      if (!isString(node.text)) {
        throw invalidBody('text node without text');
      }

      textParts.push(node.text);

      return;
    }

    if (node.type === 'hardBreak') {
      textParts.push('\n');

      return;
    }

    if (node.type === SMB_CONVERSATION_MENTION_NODE_TYPE) {
      const recordId = node.attrs?.recordId;
      const label = node.attrs?.label;

      // The node can reference any record; only a colleague counts as a mention to notify.
      if (
        node.attrs?.objectNameSingular ===
        SMB_CONVERSATION_MENTION_OBJECT_NAME_SINGULAR
      ) {
        if (!isString(recordId) || !isUuid(recordId)) {
          throw invalidBody('mention without a workspace member id');
        }

        mentionedWorkspaceMemberIds.add(recordId);
      }

      textParts.push(`@${isString(label) ? label : ''}`);

      return;
    }

    if (isDefined(node.content)) {
      if (!Array.isArray(node.content)) {
        throw invalidBody('node content must be an array');
      }

      node.content.forEach((child) => visit(child, depth + 1));
    }

    if (BLOCK_NODE_TYPES.has(node.type)) {
      textParts.push('\n');
    }
  };

  visit(rawBody, 0);

  const text = textParts.join('').trim();

  if (text.length === 0) {
    throw invalidBody('message is empty');
  }

  if (text.length > SMB_CONVERSATION_MESSAGE_MAX_TEXT_LENGTH) {
    throw invalidBody('message is too long');
  }

  return {
    body: rawBody as SmbConversationMessageBody,
    text,
    mentionedWorkspaceMemberIds: [...mentionedWorkspaceMemberIds],
  };
};
