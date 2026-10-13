import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Virtuoso } from 'react-virtuoso';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { SmbConversationMessageItem } from '@/smb-conversations/components/SmbConversationMessageItem';
import { SMB_CONVERSATION_VIRTUAL_LIST_INDEX_OFFSET } from '@/smb-conversations/constants/SmbConversationVirtualListIndexOffset';
import { useLoadSmbConversationMessages } from '@/smb-conversations/hooks/useLoadSmbConversationMessages';
import { useSendSmbConversationMessage } from '@/smb-conversations/hooks/useSendSmbConversationMessage';
import { smbConversationMessagePageFamilyState } from '@/smb-conversations/states/smbConversationMessagePageFamilyState';
import { smbConversationPendingMessagesFamilyState } from '@/smb-conversations/states/smbConversationPendingMessagesFamilyState';
import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { getSmbWorkspaceMemberName } from '@/smb-conversations/utils/getSmbWorkspaceMemberName';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledNotice = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  justify-content: center;
`;

const StyledListContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

type MessageListItem = {
  key: string;
  kind: SmbConversationMessage['kind'];
  authorWorkspaceMemberId: string | null;
  text: string;
  createdAt: string;
  isDeleted: boolean;
  isEdited: boolean;
  deliveryStatus: 'sent' | 'sending' | 'failed';
};

type SmbConversationMessageListProps = {
  conversationId: string;
};

export const SmbConversationMessageList = ({
  conversationId,
}: SmbConversationMessageListProps) => {
  const { t } = useLingui();
  const smbConversationMessagePage = useAtomFamilyStateValue(
    smbConversationMessagePageFamilyState,
    conversationId,
  );
  const smbConversationPendingMessages = useAtomFamilyStateValue(
    smbConversationPendingMessagesFamilyState,
    conversationId,
  );
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const currentWorkspaceMemberId =
    useAtomStateValue(currentWorkspaceMemberState)?.id ?? null;
  const { loadOlderSmbConversationMessages } = useLoadSmbConversationMessages();
  const { retrySmbConversationMessage } =
    useSendSmbConversationMessage(conversationId);

  if (smbConversationMessagePage.hasFailedToLoad) {
    return (
      <StyledNotice role="alert">{t`Чат недоступен`}</StyledNotice>
    );
  }

  // Mounting the list only once history is there lets it open at the newest message.
  if (!smbConversationMessagePage.isLoaded) {
    return <StyledListContainer />;
  }

  const confirmedClientMessageIds = new Set(
    smbConversationMessagePage.messages.map(
      (message) => message.clientMessageId,
    ),
  );

  // The key is the clientMessageId for both states of a message, so the row is
  // not remounted at the moment the server confirms it.
  const items: MessageListItem[] = [
    ...smbConversationMessagePage.messages.map((message) => ({
      key: message.clientMessageId,
      kind: message.kind,
      authorWorkspaceMemberId: message.authorWorkspaceMemberId,
      text: message.text,
      createdAt: message.createdAt,
      isDeleted: message.deletedAt !== null,
      isEdited: message.editedAt !== null,
      deliveryStatus: 'sent' as const,
    })),
    ...smbConversationPendingMessages
      .filter(
        (pendingMessage) =>
          !confirmedClientMessageIds.has(pendingMessage.clientMessageId),
      )
      .map((pendingMessage) => ({
        key: pendingMessage.clientMessageId,
        kind: 'TEXT' as const,
        authorWorkspaceMemberId: currentWorkspaceMemberId,
        text: pendingMessage.text,
        createdAt: pendingMessage.createdAt,
        isDeleted: false,
        isEdited: false,
        deliveryStatus: pendingMessage.status,
      })),
  ];

  const firstItemIndex =
    SMB_CONVERSATION_VIRTUAL_LIST_INDEX_OFFSET +
    (smbConversationMessagePage.messages[0]?.seq ?? 0);

  return (
    <StyledListContainer>
      <Virtuoso
        data={items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={Math.max(items.length - 1, 0)}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        startReached={() => {
          void loadOlderSmbConversationMessages(conversationId);
        }}
        computeItemKey={(_index, item) => item.key}
        itemContent={(_index, item) => {
          const author = currentWorkspaceMembers.find(
            ({ id }) => id === item.authorWorkspaceMemberId,
          );

          return (
            <SmbConversationMessageItem
              kind={item.kind}
              authorName={getSmbWorkspaceMemberName(author)}
              authorAvatarUrl={author?.avatarUrl}
              authorColorSeed={item.authorWorkspaceMemberId ?? item.key}
              text={item.text}
              createdAt={item.createdAt}
              isDeleted={item.isDeleted}
              isEdited={item.isEdited}
              deliveryStatus={item.deliveryStatus}
              onRetry={() => retrySmbConversationMessage(item.key)}
            />
          );
        }}
      />
    </StyledListContainer>
  );
};
