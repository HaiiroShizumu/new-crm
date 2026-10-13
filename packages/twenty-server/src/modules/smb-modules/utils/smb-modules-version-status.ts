// Результат сверки «версия установленного App ↔ версия кода в образе» (M-7).
// Пишется SmbModulesVersionCheckService при старте, читается SmbHealthController.
export type SmbModulesVersionMismatch = {
  key: string;
  applicationUniversalIdentifier: string;
  expectedVersion: string;
  installedVersions: {
    workspaceId: string;
    version: string | null;
    state: string;
  }[];
};

export type SmbModulesVersionStatus = {
  checkedAt: string;
  mismatches: SmbModulesVersionMismatch[];
};

let smbModulesVersionStatus: SmbModulesVersionStatus | null = null;

export const setSmbModulesVersionStatus = (
  status: SmbModulesVersionStatus | null,
): void => {
  smbModulesVersionStatus = status;
};

export const readSmbModulesVersionStatus = (): SmbModulesVersionStatus | null =>
  smbModulesVersionStatus;

// Ответ `GET /healthz/smb` (M-7, AR-8). `warning` — образ и БД не согласованы,
// но сервер работает, поэтому HTTP-статус остаётся 200; `not_checked` — сверка
// ещё не выполнялась (реестр модулей пуст или старт не завершён).
export type SmbModulesHealth = {
  status: 'ok' | 'warning' | 'not_checked';
  checkedAt: string | null;
  mismatches: SmbModulesVersionMismatch[];
};

export const readSmbModulesHealth = (): SmbModulesHealth => {
  if (smbModulesVersionStatus === null) {
    return { status: 'not_checked', checkedAt: null, mismatches: [] };
  }

  return {
    status: smbModulesVersionStatus.mismatches.length === 0 ? 'ok' : 'warning',
    checkedAt: smbModulesVersionStatus.checkedAt,
    mismatches: smbModulesVersionStatus.mismatches,
  };
};
