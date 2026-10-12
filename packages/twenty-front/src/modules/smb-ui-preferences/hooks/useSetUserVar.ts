import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';

import { currentUserState } from '@/auth/states/currentUserState';
import { SET_USER_VARS } from '@/smb-ui-preferences/graphql/mutations/setUserVars';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { isDefined } from 'twenty-shared/utils';

type SetUserVarsMutationData = {
  setUserVars: boolean;
};

// Один раз на страницу: сервер v2.45.6 не знает мутации setUserVars,
// предупреждение в консоли не должно дублироваться на каждое сохранение.
let hasWarnedUserVarUnavailable = false;

/**
 * Перенесено из `new-crm-master` (база v2.42.6) с одной адаптацией под
 * v2.45.6: в нём **нет** мутации `setUserVars` (upstream отдаёт `userVars`
 * только на чтение и только по allow-list — `user.resolver.ts:217-240`),
 * поэтому сетевой сбой здесь не валит сохранение настройки.
 *
 * Локальное значение атома пишется раньше и остаётся в localStorage-хранилище
 * атома — настройка переживает перезагрузку и без сервера. Мутация продолжает
 * вызываться: как только на сервере появятся `setUserVars` + allow-list (как в
 * старом билде — `user.resolver.ts:232` и `user/constants/user-var-allow-list.ts:18`),
 * синхронизация между устройствами включится без правок фронта.
 */
export const useSetUserVar = () => {
  const [setUserVarsMutation] =
    useMutation<SetUserVarsMutationData>(SET_USER_VARS);
  const currentUser = useAtomStateValue(currentUserState);
  const setCurrentUser = useSetAtomState(currentUserState);

  const setUserVar = useCallback(
    async (key: string, value: unknown) => {
      if (!isDefined(currentUser)) {
        return;
      }

      setCurrentUser({
        ...currentUser,
        userVars: {
          ...currentUser.userVars,
          [key]: value,
        },
      });

      try {
        await setUserVarsMutation({
          variables: { key, value },
        });
      } catch {
        // v2.45.6 не знает мутации setUserVars — значение уже лежит в
        // localStorage-атоме, поэтому не откатываем и не бросаем ошибку.
        if (!hasWarnedUserVarUnavailable) {
          hasWarnedUserVarUnavailable = true;
          // oxlint-disable-next-line no-console
          console.warn(
            `[smb] setUserVars недоступна на этом сервере — настройка «${key}» сохранена только локально (нужна серверная мутация, см. отчёт U-3).`,
          );
        }
      }
    },
    [currentUser, setCurrentUser, setUserVarsMutation],
  );

  return { setUserVar };
};
