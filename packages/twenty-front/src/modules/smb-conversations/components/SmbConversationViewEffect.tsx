import { useEffect } from 'react';

import { useLoadSmbConversationMessages } from '@/smb-conversations/hooks/useLoadSmbConversationMessages';
import { useMarkSmbConversationRead } from '@/smb-conversations/hooks/useMarkSmbConversationRead';
import { smbConversationsState } from '@/smb-conversations/states/smbConversationsState';
import { smbConversationMessagePageFamilyState } from '@/smb-conversations/states/smbConversationMessagePageFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type SmbConversationViewEffectProps = {
  conversationId: string;
};

export const SmbConversationViewEffect = ({
  conversationId,
}: SmbConversationViewEffectProps) => {
  const { loadLatestSmbConversationMessages } =
    useLoadSmbConversationMessages();
  const { markSmbConversationRead } = useMarkSmbConversationRead();
  const isPageLoaded = useAtomFamilyStateValue(
    smbConversationMessagePageFamilyState,
    conversationId,
  ).isLoaded;
  const unreadCount =
    useAtomStateValue(smbConversationsState).find(
      ({ id }) => id === conversationId,
    )?.unreadCount ?? 0;

  useEffect(() => {
    void loadLatestSmbConversationMessages(conversationId);
  }, [conversationId, loadLatestSmbConversationMessages]);

  // Reading happens by being in front of the conversation, not by a click, so
  // there is no event handler to put this in. A hidden tab does not count as read.
  useEffect(() => {
    if (!isPageLoaded || unreadCount === 0) {
      return;
    }

    const markReadIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void markSmbConversationRead(conversationId);
      }
    };

    markReadIfVisible();
    document.addEventListener('visibilitychange', markReadIfVisible);

    return () =>
      document.removeEventListener('visibilitychange', markReadIfVisible);
  }, [conversationId, isPageLoaded, markSmbConversationRead, unreadCount]);

  return null;
};
