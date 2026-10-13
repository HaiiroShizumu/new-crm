import { useCallback } from 'react';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { isDefined } from 'twenty-shared/utils';

import { GET_SMB_CONVERSATIONS } from '@/smb-conversations/graphql/queries/getSmbConversations';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { type SmbConversation } from '@/smb-conversations/types/SmbConversation';
import { sortSmbConversations } from '@/smb-conversations/utils/sortSmbConversations';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

export const useLoadSmbConversations = () => {
  const apolloClient = useApolloCoreClient();
  const setSmbConversations = useSetAtomState(smbConversationsState);

  const loadSmbConversations = useCallback(async () => {
    // The live state is kept in Jotai and patched by events; an Apollo cache
    // copy would only be a second, staler source.
    const { data } = await apolloClient.query<{
      messengerConversations: SmbConversation[];
    }>({ query: GET_SMB_CONVERSATIONS, fetchPolicy: 'no-cache' });

    if (isDefined(data)) {
      setSmbConversations(sortSmbConversations(data.messengerConversations));
    }
  }, [apolloClient, setSmbConversations]);

  return { loadSmbConversations };
};
