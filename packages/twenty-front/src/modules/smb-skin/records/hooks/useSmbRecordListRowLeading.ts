import { SMB_RECORD_LIST_ROW_LEADING_BY_OBJECT } from '@/smb-skin/records/constants/SmbRecordListRowLeadingByObject';

export const useSmbRecordListRowLeading = (objectNameSingular: string) => {
  return SMB_RECORD_LIST_ROW_LEADING_BY_OBJECT[objectNameSingular] ?? null;
};
