import { type ComponentType } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { SmbDealCardBody } from '@/smb-skin/records/components/SmbDealCardBody';
import { SmbTaskCardBody } from '@/smb-skin/records/components/SmbTaskCardBody';

export const SMB_RECORD_BOARD_CARD_BODY_BY_OBJECT: Partial<
  Record<string, ComponentType>
> = {
  [CoreObjectNameSingular.Opportunity]: SmbDealCardBody,
  [CoreObjectNameSingular.Task]: SmbTaskCardBody,
};
