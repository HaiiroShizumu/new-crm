import { type ComponentType } from 'react';

import { SmbDocumentFileViewer } from '@/smb-docflow/components/SmbDocumentFileViewer';
import { type SmbDocumentEditorKind } from '@/smb-docflow/types/SmbDocumentEditorKind';
import { type SmbDocumentEditorProps } from '@/smb-docflow/types/SmbDocumentEditorProps';

// What opens a document of each kind (ADR-016, item 8). An editor is added by
// replacing one entry here; the document model already carries the kind and
// the editor snapshot.
export const SMB_DOCUMENT_EDITORS: Record<
  SmbDocumentEditorKind,
  ComponentType<SmbDocumentEditorProps>
> = {
  NONE: SmbDocumentFileViewer,
  UNIVER_SHEET: SmbDocumentFileViewer,
  UNIVER_DOC: SmbDocumentFileViewer,
};
