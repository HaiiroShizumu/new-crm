import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { Avatar } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

const StyledContainer = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  padding: ${themeCssVariables.spacing['0.5']};
`;

export const SmbTopBarCurrentUser = () => {
  const { t } = useLingui();
  const navigateSettings = useNavigateSettings();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const firstName = currentWorkspaceMember?.name?.firstName ?? '';
  const lastName = currentWorkspaceMember?.name?.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <StyledContainer
      type="button"
      data-smb-top-user
      aria-label={t`Profile`}
      title={fullName}
      onClick={() => navigateSettings(SettingsPath.ProfilePage)}
    >
      <Avatar
        shape="circle"
        size="xl"
        name={fullName}
        colorSeed={currentWorkspaceMember?.id}
        src={getAbsoluteImageUrl(currentWorkspaceMember?.avatarUrl)}
      />
    </StyledContainer>
  );
};
