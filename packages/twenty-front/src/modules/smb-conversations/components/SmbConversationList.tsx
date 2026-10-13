import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyArray } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { SmbConversationListItem } from '@/smb-conversations/components/SmbConversationListItem';
import { useOpenSmbDirectConversation } from '@/smb-conversations/hooks/useOpenSmbDirectConversation';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { getSmbConversationPath } from '@/smb-conversations/utils/getSmbConversationPath';
import { getSmbConversationTitle } from '@/smb-conversations/utils/getSmbConversationTitle';
import { getSmbDirectConversationColleagueId } from '@/smb-conversations/utils/getSmbDirectConversationColleagueId';
import { getSmbWorkspaceMemberName } from '@/smb-conversations/utils/getSmbWorkspaceMemberName';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledList = styled.nav`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing['0.5']};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
  width: 280px;
`;

const StyledSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]};
`;

type SmbConversationListProps = {
  activeConversationId: string | undefined;
};

export const SmbConversationList = ({
  activeConversationId,
}: SmbConversationListProps) => {
  const { t } = useLingui();
  const smbConversations = useAtomStateValue(smbConversationsState);
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const currentWorkspaceMemberId = useAtomStateValue(
    currentWorkspaceMemberState,
  )?.id;
  const { openSmbDirectConversation } = useOpenSmbDirectConversation();

  const colleagueIdsWithConversation = new Set(
    smbConversations.map((conversation) =>
      getSmbDirectConversationColleagueId(
        conversation,
        currentWorkspaceMemberId,
      ),
    ),
  );

  // Colleagues the user has not talked to yet are listed too, so starting a
  // conversation is one click instead of a search.
  const colleaguesWithoutConversation = currentWorkspaceMembers.filter(
    (workspaceMember) =>
      workspaceMember.id !== currentWorkspaceMemberId &&
      !colleagueIdsWithConversation.has(workspaceMember.id),
  );

  return (
    <StyledList aria-label={t`Чаты`}>
      {isNonEmptyArray(smbConversations) && (
        <StyledSectionTitle>{t`Чаты`}</StyledSectionTitle>
      )}
      {smbConversations.map((conversation) => {
        const colleagueId = getSmbDirectConversationColleagueId(
          conversation,
          currentWorkspaceMemberId,
        );
        const lastMessage = conversation.lastMessage;

        return (
          <SmbConversationListItem
            key={conversation.id}
            title={getSmbConversationTitle({
              conversation,
              currentWorkspaceMemberId,
              workspaceMembers: currentWorkspaceMembers,
            })}
            avatarUrl={
              currentWorkspaceMembers.find(({ id }) => id === colleagueId)
                ?.avatarUrl
            }
            colorSeed={colleagueId ?? conversation.id}
            preview={
              lastMessage?.deletedAt
                ? t`Сообщение удалено`
                : (lastMessage?.text ?? '')
            }
            unreadCount={conversation.unreadCount}
            isActive={conversation.id === activeConversationId}
            to={getSmbConversationPath(conversation.id)}
          />
        );
      })}
      {isNonEmptyArray(colleaguesWithoutConversation) && (
        <StyledSectionTitle>{t`Сотрудники`}</StyledSectionTitle>
      )}
      {colleaguesWithoutConversation.map((workspaceMember) => (
        <SmbConversationListItem
          key={workspaceMember.id}
          title={getSmbWorkspaceMemberName(workspaceMember)}
          avatarUrl={workspaceMember.avatarUrl}
          colorSeed={workspaceMember.id}
          preview=""
          unreadCount={0}
          isActive={false}
          onClick={() => {
            void openSmbDirectConversation(workspaceMember.id);
          }}
        />
      ))}
    </StyledList>
  );
};
