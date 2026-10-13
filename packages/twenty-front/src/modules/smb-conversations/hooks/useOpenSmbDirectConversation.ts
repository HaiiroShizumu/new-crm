import { useStore } from 'jotai';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

import { OPEN_SMB_DIRECT_CONVERSATION } from '@/smb-conversations/graphql/mutations/openSmbDirectConversation';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { getSmbConversationPath } from '@/smb-conversations/utils/getSmbConversationPath';
import { sortSmbConversations } from '@/smb-conversations/utils/sortSmbConversations';

export const useOpenSmbDirectConversation = () => {
  const apolloClient = useApolloCoreClient();
  const navigate = useNavigate();
  const store = useStore();

  const openSmbDirectConversation = useCallback(
    async (colleagueWorkspaceMemberId: string) => {
      const { data } = await apolloClient.mutate<{
        openMessengerDirectConversation: SmbConversation;
      }>({
        mutation: OPEN_SMB_DIRECT_CONVERSATION,
        variables: { colleagueWorkspaceMemberId },
      });

      const conversation = data?.openMessengerDirectConversation;

      if (!isDefined(conversation)) {
        return;
      }

      store.set(smbConversationsState.atom, (conversations) =>
        sortSmbConversations([
          ...conversations.filter(({ id }) => id !== conversation.id),
          conversation,
        ]),
      );

      navigate(getSmbConversationPath(conversation.id));
    },
    [apolloClient, navigate, store],
  );

  return { openSmbDirectConversation };
};
