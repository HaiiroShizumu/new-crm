import { smbChromeActionsHostState } from '@/smb-skin/states/smbChromeActionsHostState';
import { smbChromeTitleHostState } from '@/smb-skin/states/smbChromeTitleHostState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

export const useSmbChromePortal = () => {
  const [smbChromeTitleHost, setSmbChromeTitleHost] = useAtomState(
    smbChromeTitleHostState,
  );
  const [smbChromeActionsHost, setSmbChromeActionsHost] = useAtomState(
    smbChromeActionsHostState,
  );

  // Публичное имя хука сохранено: переименование внутренних переменных
  // нужно только правилу twenty(matching-state-variable).
  return {
    title: smbChromeTitleHost,
    actions: smbChromeActionsHost,
    setTitle: setSmbChromeTitleHost,
    setActions: setSmbChromeActionsHost,
  };
};
