import { isNonEmptyString } from '@sniptt/guards';

import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { getSmbWorkspaceMemberName } from '@/smb-conversations/utils/getSmbWorkspaceMemberName';

type NamedWorkspaceMember = {
  id: string;
  name: { firstName?: string | null; lastName?: string | null };
};

// A direct conversation has no name of its own: each side sees it under the other person's name.
export const getSmbConversationTitle = ({
  conversation,
  currentWorkspaceMemberId,
  workspaceMembers,
}: {
  conversation: SmbConversation;
  currentWorkspaceMemberId: string | undefined;
  workspaceMembers: NamedWorkspaceMember[];
}): string => {
  if (conversation.kind === 'GROUP' && isNonEmptyString(conversation.name)) {
    return conversation.name;
  }

  const colleagueWorkspaceMemberId = conversation.members.find(
    (member) => member.workspaceMemberId !== currentWorkspaceMemberId,
  )?.workspaceMemberId;

  return getSmbWorkspaceMemberName(
    workspaceMembers.find(({ id }) => id === colleagueWorkspaceMemberId),
  );
};
