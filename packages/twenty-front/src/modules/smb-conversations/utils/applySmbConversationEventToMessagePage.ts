import { isDefined } from 'twenty-shared/utils';

import { type SmbConversationEvent } from '@/smb-conversations/types/SmbConversationEvent';
import { type SmbConversationMessagePage } from '@/smb-conversations/types/SmbConversationMessagePage';
import { upsertSmbConversationMessages } from '@/smb-conversations/utils/upsertSmbConversationMessages';

const MESSAGE_EVENT_TYPES: SmbConversationEvent['type'][] = [
  'MESSAGE_CREATED',
  'MESSAGE_UPDATED',
  'MESSAGE_DELETED',
];

export const applySmbConversationEventToMessagePage = (
  page: SmbConversationMessagePage,
  event: SmbConversationEvent,
): SmbConversationMessagePage => {
  // A page that was never opened stays empty: its first load fetches the newest
  // messages anyway, and a lone live message would look like the whole history.
  if (
    !page.isLoaded ||
    !MESSAGE_EVENT_TYPES.includes(event.type) ||
    !isDefined(event.message)
  ) {
    return page;
  }

  return {
    ...page,
    messages: upsertSmbConversationMessages(page.messages, [event.message]),
  };
};
