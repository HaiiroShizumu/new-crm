import { isDefined } from 'twenty-shared/utils';

import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';

// RV-2 / ADR-009 п.3 (серверная половина): модуль включён только тогда, когда
// его App установлен и установка завершена. Правило то же, что на фронте:
//   * version === null — установка не дошла до markInstallCompleted (упала
//     посреди, откат свежей установки её строку вообще удаляет);
//   * state !== INSTALLED — идёт установка/апгрейд/удаление;
//   * deletedAt — App снят, строка осталась как soft-delete.
export const isSmbModuleApplicationEnabled = (
  application: Pick<ApplicationEntity, 'version' | 'state' | 'deletedAt'>,
): boolean =>
  isDefined(application.version) &&
  application.state === ApplicationState.INSTALLED &&
  !isDefined(application.deletedAt);
