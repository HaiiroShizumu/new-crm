import { useCallback } from 'react';

import { useSetUserVar } from '@/smb-ui-preferences/hooks/useSetUserVar';
import { type UserVarUiPreferenceKey } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { type createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

type AtomState<TValue> = ReturnType<typeof createAtomState<TValue>>;

export const usePersistedUiPreference = <TValue>(
  atomState: AtomState<TValue>,
  userVarKey: UserVarUiPreferenceKey,
) => {
  // Имена `atom` / `setAtom` требует house-правило twenty(matching-state-variable):
  // для параметра `atomState` допустимы только эти имена.
  const [atom, setAtom] = useAtomState(atomState);
  const { setUserVar } = useSetUserVar();

  const setValue = useCallback(
    async (nextValue: TValue | ((previous: TValue) => TValue)) => {
      const resolved =
        typeof nextValue === 'function'
          ? (nextValue as (previous: TValue) => TValue)(atom)
          : nextValue;

      setAtom(resolved);
      await setUserVar(userVarKey, resolved);
    },
    [setAtom, setUserVar, userVarKey, atom],
  );

  return [atom, setValue] as const;
};
