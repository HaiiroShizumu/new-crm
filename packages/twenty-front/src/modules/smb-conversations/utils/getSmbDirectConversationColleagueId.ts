import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';

export const getSmbDirectConversationColleagueId = (
  conversation: SmbConversation,
  currentWorkspaceMemberId: string | undefined,
): string | undefined =>
  conversation.kind === 'DIRECT'
    ? conversation.members.find(
        (member) => member.workspaceMemberId !== currentWorkspaceMemberId,
      )?.workspaceMemberId
    : undefined;
