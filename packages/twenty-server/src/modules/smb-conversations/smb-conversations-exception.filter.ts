import { Catch, type ExceptionFilter } from '@nestjs/common';

import { assertUnreachable } from 'twenty-shared/utils';

import {
  ForbiddenError,
  NotFoundError,
  UserInputError,
} from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';

@Catch(SmbConversationsException)
export class SmbConversationsExceptionFilter implements ExceptionFilter {
  catch(exception: SmbConversationsException) {
    switch (exception.code) {
      case SmbConversationsExceptionCode.WORKSPACE_MEMBER_REQUIRED:
      case SmbConversationsExceptionCode.NOT_MESSAGE_AUTHOR:
        throw new ForbiddenError(exception);
      // A non-member gets the same answer as for a missing conversation, so conversation ids cannot be probed.
      case SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND:
      case SmbConversationsExceptionCode.MESSAGE_NOT_FOUND:
      case SmbConversationsExceptionCode.WORKSPACE_MEMBER_NOT_FOUND:
        throw new NotFoundError(exception);
      case SmbConversationsExceptionCode.INVALID_MESSAGE_BODY:
      case SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT:
        throw new UserInputError(exception);
      default: {
        assertUnreachable(exception.code);
      }
    }
  }
}
