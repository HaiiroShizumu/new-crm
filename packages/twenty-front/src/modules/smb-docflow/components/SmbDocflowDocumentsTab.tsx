import { useLingui } from '@lingui/react/macro';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';

// Folders and documents are objects of the smb-docflow application
// (docs/adr/ADR-010-docflow.md, section "Документы"); the tab is built once
// the application is installable.
export const SmbDocflowDocumentsTab = () => {
  const { t } = useLingui();

  return <SmbDocflowEmptyState message={t`Здесь появятся документы.`} />;
};
