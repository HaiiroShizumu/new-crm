import { useLingui } from '@lingui/react/macro';

import { SmbDocflowDocumentsBrowser } from '@/smb-docflow/components/SmbDocflowDocumentsBrowser';
import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { useIsSmbDocflowAppInstalled } from '@/smb-docflow/hooks/useIsSmbDocflowAppInstalled';

// Folders and documents are objects of the docflow application
// (docs/adr/ADR-016-docflow.md, item 8). Tasks and processes work without it.
export const SmbDocflowDocumentsTab = () => {
  const { t } = useLingui();
  const isDocflowAppInstalled = useIsSmbDocflowAppInstalled();

  if (!isDocflowAppInstalled) {
    return (
      <SmbDocflowEmptyState
        message={t`Установите приложение «Документооборот», чтобы работать с документами.`}
      />
    );
  }

  return <SmbDocflowDocumentsBrowser />;
};
