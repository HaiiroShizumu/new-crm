import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';

export type SmbDocflowTaskWithOwnership = SmbDocflowTask & {
  isMine: boolean;
};
