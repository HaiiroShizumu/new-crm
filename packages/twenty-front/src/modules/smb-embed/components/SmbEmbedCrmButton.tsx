import { useLingui } from '@lingui/react/macro';
import { Button } from 'twenty-ui/primitives/input';
import { IconExternalLink } from 'twenty-ui/icon';

import { useOpenSmbCrm } from '@/smb-embed/hooks/useOpenSmbCrm';

export const SmbEmbedCrmButton = () => {
  const { t } = useLingui();
  const { openSmbCrm } = useOpenSmbCrm();

  return (
    <Button
      startIcon={<IconExternalLink />}
      variant="outline"
      size="sm"
      onClick={openSmbCrm}
    >
      {t`Открыть CRM`}
    </Button>
  );
};
