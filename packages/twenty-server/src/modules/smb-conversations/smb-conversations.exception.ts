import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum SmbConversationsExceptionCode {
  WORKSPACE_MEMBER_REQUIRED = 'WORKSPACE_MEMBER_REQUIRED',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  NOT_MESSAGE_AUTHOR = 'NOT_MESSAGE_AUTHOR',
  INVALID_MESSAGE_BODY = 'INVALID_MESSAGE_BODY',
  INVALID_CONVERSATION_INPUT = 'INVALID_CONVERSATION_INPUT',
  WORKSPACE_MEMBER_NOT_FOUND = 'WORKSPACE_MEMBER_NOT_FOUND',
}

const getSmbConversationsExceptionUserFriendlyMessage = (
  code: SmbConversationsExceptionCode,
) => {
  switch (code) {
    case SmbConversationsExceptionCode.WORKSPACE_MEMBER_REQUIRED:
      return msg`The messenger is only available to workspace members.`;
    case SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND:
      return msg`Conversation not found.`;
    case SmbConversationsExceptionCode.MESSAGE_NOT_FOUND:
      return msg`Message not found.`;
    case SmbConversationsExceptionCode.NOT_MESSAGE_AUTHOR:
      return msg`Only the author can change this message.`;
    case SmbConversationsExceptionCode.INVALID_MESSAGE_BODY:
      return msg`This message cannot be sent.`;
    case SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT:
      return msg`This conversation cannot be created.`;
    case SmbConversationsExceptionCode.WORKSPACE_MEMBER_NOT_FOUND:
      return msg`Workspace member not found.`;
    default:
      assertUnreachable(code);
  }
};

export class SmbConversationsException extends CustomException<SmbConversationsExceptionCode> {
  constructor(
    message: string,
    code: SmbConversationsExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ??
        getSmbConversationsExceptionUserFriendlyMessage(code),
    });
  }
}
