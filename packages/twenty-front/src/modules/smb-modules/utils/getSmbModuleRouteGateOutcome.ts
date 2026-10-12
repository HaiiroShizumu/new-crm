// RV-3: пока список App (и статусы жизненного цикла) не загружен, страницу не
// показываем и не редиректим — иначе выключенный модуль мелькал бы своей
// страницей до ухода на главную.
export type SmbModuleRouteGateOutcome = 'loading' | 'redirect' | 'open';

export type GetSmbModuleRouteGateOutcomeArgs = {
  isInstalledApplicationsLoaded: boolean;
  isApplicationLifecycleLoading: boolean;
  isEnabled: boolean;
};

export const getSmbModuleRouteGateOutcome = ({
  isInstalledApplicationsLoaded,
  isApplicationLifecycleLoading,
  isEnabled,
}: GetSmbModuleRouteGateOutcomeArgs): SmbModuleRouteGateOutcome => {
  if (!isInstalledApplicationsLoaded || isApplicationLifecycleLoading) {
    return 'loading';
  }

  return isEnabled ? 'open' : 'redirect';
};
