import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { LightIconButton, useToast } from 'twenty-ui/components';
import { IconMaximize, IconMinimize } from 'twenty-ui/icon';

import { SMB_EMBED_EXPANDED_QUERY_PARAM } from '@/smb-embed/constants/SmbEmbedExpandedQueryParam';
import { loadSmbBitrix24Api } from '@/smb-embed/utils/loadSmbBitrix24Api';

// Bitrix24 has no "resize this frame" call. Fullscreen is the portal's own
// slider: the application is opened a second time on top of the page, and the
// expanded copy closes itself to go back.
export const SmbEmbedFullscreenButton = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { search } = useLocation();

  const isExpanded =
    new URLSearchParams(search).get(SMB_EMBED_EXPANDED_QUERY_PARAM) === '1';

  const handleClick = async () => {
    try {
      const bitrix24Api = await loadSmbBitrix24Api();

      if (isExpanded) {
        bitrix24Api.closeApplication();

        return;
      }

      bitrix24Api.openApplication({ [SMB_EMBED_EXPANDED_QUERY_PARAM]: '1' });
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`Полноэкранный режим сейчас недоступен.`,
      });
    }
  };

  return (
    <LightIconButton
      aria-label={
        isExpanded ? t`Выйти из полноэкранного режима` : t`На весь экран`
      }
      onClick={handleClick}
    >
      {isExpanded ? <IconMinimize /> : <IconMaximize />}
    </LightIconButton>
  );
};
