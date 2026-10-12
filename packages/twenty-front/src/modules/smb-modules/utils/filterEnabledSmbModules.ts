import { type SmbApplicationLifecycle } from '@/smb-modules/types/SmbApplicationLifecycle';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { SMB_BLOCKED_APPLICATION_LIFECYCLES } from '@/smb-modules/utils/getSmbApplicationLifecycle';
import { isDefined } from 'twenty-shared/utils';

// Модуль включён тогда и только тогда, когда установлен его App (ADR-009 п.3):
// один источник правды на фронте и на сервере. dependsOn на включение не
// влияет — он задаёт только порядок установки в пресете.
//
// RV-2: одной записи в списке недостаточно — установка не завершена, завершилась
// ошибкой или приложение удаляется, и модуль выключен, даже если запись App уже
// есть. Неизвестное состояние ('unknown' — нет прав смотреть статусы, или ключ
// ещё не записан) выключением не считается: тогда решает только список.
export const filterEnabledSmbModules = (
  manifests: readonly SmbModuleManifest[],
  installedUniversalIdentifiers: ReadonlySet<string>,
  lifecycleByUniversalIdentifier: Readonly<
    Record<string, SmbApplicationLifecycle>
  > = {},
): SmbModuleManifest[] =>
  manifests.filter((manifest) => {
    const { applicationUniversalIdentifier } = manifest;

    if (!installedUniversalIdentifiers.has(applicationUniversalIdentifier)) {
      return false;
    }

    const lifecycle =
      lifecycleByUniversalIdentifier[applicationUniversalIdentifier];

    return (
      !isDefined(lifecycle) ||
      !SMB_BLOCKED_APPLICATION_LIFECYCLES.includes(lifecycle)
    );
  });
