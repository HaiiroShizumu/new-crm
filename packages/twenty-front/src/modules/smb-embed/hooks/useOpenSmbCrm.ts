import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { useToast } from 'twenty-ui/components';

import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { CREATE_SMB_BITRIX_CRM_LINK } from '@/smb-embed/graphql/mutations/createSmbBitrixCrmLink';

type CreateSmbBitrixCrmLinkResult = {
  createSmbBitrixCrmLink: { url: string };
};

export const useOpenSmbCrm = () => {
  const apolloClient = useApolloCoreClient();
  const { enqueueToast } = useToast();
  const { t } = useLingui();

  const openSmbCrm = useCallback(async () => {
    // Opened before the request: a tab opened after an await is no longer
    // tied to the click, and the browser blocks it as a pop-up.
    const crmTab = window.open('about:blank', '_blank');

    try {
      const { data } = await apolloClient.mutate<CreateSmbBitrixCrmLinkResult>({
        mutation: CREATE_SMB_BITRIX_CRM_LINK,
      });
      const url = data?.createSmbBitrixCrmLink.url;

      if (!isNonEmptyString(url)) {
        throw new Error('No CRM link returned');
      }

      if (crmTab === null) {
        window.open(url, '_blank', 'noopener');

        return;
      }

      crmTab.opener = null;
      crmTab.location.replace(url);
    } catch {
      crmTab?.close();
      enqueueToast({
        variant: 'error',
        children: t`Не удалось открыть CRM. Попробуйте ещё раз.`,
      });
    }
  }, [apolloClient, enqueueToast, t]);

  return { openSmbCrm };
};
