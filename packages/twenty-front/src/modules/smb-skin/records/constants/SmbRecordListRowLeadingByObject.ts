import { type ComponentType } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { SmbTaskCheck } from '@/smb-skin/records/components/SmbTaskCheck';
import { type SmbRecordListRowLeadingProps } from '@/smb-skin/records/types/SmbRecordListRowLeadingProps';

export const SMB_RECORD_LIST_ROW_LEADING_BY_OBJECT: Partial<
  Record<string, ComponentType<SmbRecordListRowLeadingProps>>
> = {
  [CoreObjectNameSingular.Task]: SmbTaskCheck,
};
