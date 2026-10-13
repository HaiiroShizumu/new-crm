import { SMB_DOCFLOW_DEFAULT_TAB } from '@/smb-docflow/constants/SmbDocflowDefaultTab';
import { SMB_DOCFLOW_TABS } from '@/smb-docflow/constants/SmbDocflowTabs';
import { type SmbDocflowTab } from '@/smb-docflow/types/SmbDocflowTab';

export const getSmbDocflowTabFromParam = (
  tabParam: string | undefined,
): SmbDocflowTab =>
  SMB_DOCFLOW_TABS.find((tab) => tab === tabParam) ?? SMB_DOCFLOW_DEFAULT_TAB;
