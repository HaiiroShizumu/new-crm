import { applicationsLoadSequenceState } from '@/applications/states/applicationsLoadSequenceState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Список App подгружается эффектом внутри WorkspaceAppProviders, то есть после
// первого рендера. Пока счётчик загрузок равен нулю, состав установленных
// неизвестен: редирект в этот момент сломал бы прямую ссылку на модуль.
export const useIsInstalledApplicationsLoaded = (): boolean =>
  useAtomStateValue(applicationsLoadSequenceState) > 0;
