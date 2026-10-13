import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useParams } from 'react-router-dom';

import { SmbDocflowDocumentsTab } from '@/smb-docflow/components/SmbDocflowDocumentsTab';
import { SmbDocflowHeaderActions } from '@/smb-docflow/components/SmbDocflowHeaderActions';
import { SmbDocflowProcessesTab } from '@/smb-docflow/components/SmbDocflowProcessesTab';
import { SmbDocflowTabBar } from '@/smb-docflow/components/SmbDocflowTabBar';
import { SmbDocflowTasksTab } from '@/smb-docflow/components/SmbDocflowTasksTab';
import { getSmbDocflowTabFromParam } from '@/smb-docflow/utils/getSmbDocflowTabFromParam';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';

const StyledBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
`;

export const SmbDocflowPage = () => {
  const { t } = useLingui();
  const { tab: tabParam } = useParams();
  const activeTab = getSmbDocflowTabFromParam(tabParam);

  return (
    <PageCardLayout
      header={
        <PageCardHeader
          title={t`Документооборот`}
          actionButton={<SmbDocflowHeaderActions />}
        />
      }
    >
      <StyledBody>
        <SmbDocflowTabBar activeTab={activeTab} />
        {activeTab === 'tasks' && <SmbDocflowTasksTab />}
        {activeTab === 'processes' && <SmbDocflowProcessesTab />}
        {activeTab === 'documents' && <SmbDocflowDocumentsTab />}
      </StyledBody>
    </PageCardLayout>
  );
};
