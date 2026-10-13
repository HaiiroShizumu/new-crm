import { type SmbDocumentFolder } from '@/smb-docflow/types/SmbDocumentFolder';

export type SmbDocumentFolderNode = {
  folder: SmbDocumentFolder;
  children: SmbDocumentFolderNode[];
};
