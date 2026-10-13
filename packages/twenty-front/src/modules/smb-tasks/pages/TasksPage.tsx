import { Trans } from '@lingui/react/macro';

import { styled } from '@linaria/react';

const StyledTasksPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: auto;
  padding: 16px;
`;

export const TasksPage = () => (
  <StyledTasksPage>
    <Trans>Задачи 2.0</Trans>
  </StyledTasksPage>
);
