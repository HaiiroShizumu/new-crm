import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type SmbApplicationLifecycle } from '@/smb-modules/types/SmbApplicationLifecycle';

// universalIdentifier приложения -> состояние его жизненного цикла (RV-2).
// Заполняется SmbApplicationLifecycleLoaders; отсутствие ключа означает
// «неизвестно», и решение принимает только список установленных App.
export const smbApplicationLifecycleState = createAtomState<
  Record<string, SmbApplicationLifecycle>
>({
  key: 'smb.applicationLifecycle',
  defaultValue: {},
});
