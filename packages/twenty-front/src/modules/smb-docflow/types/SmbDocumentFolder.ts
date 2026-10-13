import { type SmbDocumentFolderColor } from '@/smb-docflow/types/SmbDocumentFolderColor';

export type SmbDocumentFolder = {
  __typename: string;
  id: string;
  name: string;
  color: SmbDocumentFolderColor | null;
  parentFolderId: string | null;
};
