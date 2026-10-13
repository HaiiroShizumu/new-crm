import { SMB_DOCFLOW_PATH } from '@/smb-docflow/constants/SmbDocflowPath';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { TabButton } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

import { SMB_DOCFLOW_TABS } from '@/smb-docflow/constants/SmbDocflowTabs';
import { type SmbDocflowTab } from '@/smb-docflow/types/SmbDocflowTab';

const StyledTabBar = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  padding: 0 ${themeCssVariables.spacing[3]};
`;

type SmbDocflowTabBarProps = {
  activeTab: SmbDocflowTab;
};

export const SmbDocflowTabBar = ({ activeTab }: SmbDocflowTabBarProps) => {
  const { t } = useLingui();

  const tabLabels: Record<SmbDocflowTab, string> = {
    tasks: t`Задания`,
    processes: t`Процессы`,
    documents: t`Документы`,
  };

  return (
    <StyledTabBar>
      {SMB_DOCFLOW_TABS.map((tab) => (
        <TabButton
          key={tab}
          active={tab === activeTab}
          render={<Link to={`${SMB_DOCFLOW_PATH}/${tab}`} />}
        >
          {tabLabels[tab]}
        </TabButton>
      ))}
    </StyledTabBar>
  );
};
