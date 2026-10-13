import { type FieldFilesValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { type SmbDocumentEditorKind } from '@/smb-docflow/types/SmbDocumentEditorKind';

export type SmbDocument = {
  __typename: string;
  id: string;
  name: string;
  status: string | null;
  editorKind: SmbDocumentEditorKind | null;
  createdAt: string;
  folderId: string | null;
  authorId?: string | null;
  file: FieldFilesValue[] | null;
  author?: {
    id: string;
    name?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
};
