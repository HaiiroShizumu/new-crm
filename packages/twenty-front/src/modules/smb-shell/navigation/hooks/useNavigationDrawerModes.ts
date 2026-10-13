import { useLingui } from '@lingui/react/macro';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { type IconComponent, IconMessageCircle } from 'twenty-ui/icon';

import { IconHomeMode } from '@/smb-shell/navigation/branding/components/IconHomeMode';
import {
  SMB_NAVIGATION_DRAWER_MODES,
  type SmbNavigationDrawerMode,
} from '@/smb-shell/navigation/constants/SmbNavigationDrawerModes';
import { useIsWorkspaceActivationStatusEqualsTo } from '@/workspace/hooks/useIsWorkspaceActivationStatusEqualsTo';

export type NavigationDrawerMode = {
  Icon: IconComponent;
  label: string;
  mode: SmbNavigationDrawerMode;
};

// U-2 (перенос v2.42.6 -> v2.45.6): в старом билде список режимов ящика
// содержал Messenger и Document management — это были условия в коде. В базе
// v2.45.6 режимов MESSENGER/DOC_MANAGEMENT больше нет, а разделы будущих
// модулей приходят в меню из реестра (useEnabledSmbModules), а не отсюда.
export const useNavigationDrawerModes = (): NavigationDrawerMode[] => {
  const { t } = useLingui();

  const isWorkspaceSuspended = useIsWorkspaceActivationStatusEqualsTo(
    WorkspaceActivationStatus.SUSPENDED,
  );

  // A suspended workspace is held on the billing settings by the route guard,
  // so offering the modes it would bounce back from only flashes the user out
  // and in again.
  if (isWorkspaceSuspended) {
    return [];
  }

  return [
    {
      Icon: IconHomeMode,
      label: t`CRM`,
      mode: SMB_NAVIGATION_DRAWER_MODES.NAVIGATION_MENU,
    },
    {
      Icon: IconMessageCircle,
      label: t`Чаты`,
      mode: SMB_NAVIGATION_DRAWER_MODES.MESSENGER,
    },
  ];
};
