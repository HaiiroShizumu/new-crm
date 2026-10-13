import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { SmbConversationComposer } from '@/smb-conversations/components/SmbConversationComposer';
import { SmbConversationViewEffect } from '@/smb-conversations/components/SmbConversationViewEffect';
import { SmbConversationMessageList } from '@/smb-conversations/components/SmbConversationMessageList';
import { SmbConversationTypingIndicator } from '@/smb-conversations/components/SmbConversationTypingIndicator';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { getSmbConversationTitle } from '@/smb-conversations/utils/getSmbConversationTitle';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledConversation = styled.section`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`;

const StyledTitle = styled.h2`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin: 0;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

type SmbConversationViewProps = {
  conversationId: string;
};

export const SmbConversationView = ({
  conversationId,
}: SmbConversationViewProps) => {
  const conversation = useAtomStateValue(smbConversationsState).find(
    ({ id }) => id === conversationId,
  );
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const currentWorkspaceMemberId = useAtomStateValue(
    currentWorkspaceMemberState,
  )?.id;

  return (
    <StyledConversation>
      <SmbConversationViewEffect conversationId={conversationId} />
      <StyledTitle>
        {conversation !== undefined &&
          getSmbConversationTitle({
            conversation,
            currentWorkspaceMemberId,
            workspaceMembers: currentWorkspaceMembers,
          })}
      </StyledTitle>
      <SmbConversationMessageList conversationId={conversationId} />
      <SmbConversationTypingIndicator conversationId={conversationId} />
      <SmbConversationComposer conversationId={conversationId} />
    </StyledConversation>
  );
};
