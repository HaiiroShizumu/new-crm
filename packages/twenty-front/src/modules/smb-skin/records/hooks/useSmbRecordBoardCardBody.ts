import { SMB_RECORD_BOARD_CARD_BODY_BY_OBJECT } from '@/smb-skin/records/constants/SmbRecordBoardCardBodyByObject';

export const useSmbRecordBoardCardBody = (objectNameSingular: string) => {
  return SMB_RECORD_BOARD_CARD_BODY_BY_OBJECT[objectNameSingular] ?? null;
};
