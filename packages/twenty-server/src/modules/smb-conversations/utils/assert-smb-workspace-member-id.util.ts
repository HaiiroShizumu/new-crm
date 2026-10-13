import { isNonEmptyString } from '@sniptt/guards';

import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';

export function assertSmbWorkspaceMemberId(
  workspaceMemberId: string | undefined,
): asserts workspaceMemberId is string {
  if (!isNonEmptyString(workspaceMemberId)) {
    throw new SmbConversationsException(
      'The messenger requires a workspace member session',
      SmbConversationsExceptionCode.WORKSPACE_MEMBER_REQUIRED,
    );
  }
}
