import { isTerminalJobState } from '@/queue-job/utils/isTerminalJobState';
import { type SmbApplicationLifecycle } from '@/smb-modules/types/SmbApplicationLifecycle';
import { isDefined } from 'twenty-shared/utils';
import { JobState } from '~/generated-metadata/graphql';

type JobStatusLike = { state: JobState } | null | undefined;

export type GetSmbApplicationLifecycleArgs = {
  // SettingsPermissionGuard(APPLICATIONS) на обоих запросах: без прав статусы
  // не смотрим и полагаемся только на список установленных App.
  canSeeJobStatus: boolean;
  isLoadingJobStatus: boolean;
  installJobStatus: JobStatusLike;
  uninstallJobStatus: JobStatusLike;
};

const isJobRunning = (jobStatus: JobStatusLike): boolean =>
  isDefined(jobStatus) && !isTerminalJobState(jobStatus.state);

export const getSmbApplicationLifecycle = ({
  canSeeJobStatus,
  isLoadingJobStatus,
  installJobStatus,
  uninstallJobStatus,
}: GetSmbApplicationLifecycleArgs): SmbApplicationLifecycle => {
  if (!canSeeJobStatus) {
    return 'unknown';
  }

  if (isLoadingJobStatus) {
    return 'loading';
  }

  // Удаление важнее: запись App остаётся в списке до конца джобы, и модуль
  // не должен открываться, пока приложение удаляется.
  if (isJobRunning(uninstallJobStatus)) {
    return 'uninstalling';
  }

  if (isJobRunning(installJobStatus)) {
    return 'installing';
  }

  if (installJobStatus?.state === JobState.FAILED) {
    return 'install-failed';
  }

  return 'idle';
};

// Состояния, в которых модуль считается выключенным, даже если запись App
// уже есть в списке установленных приложений.
export const SMB_BLOCKED_APPLICATION_LIFECYCLES: readonly SmbApplicationLifecycle[] =
  ['installing', 'install-failed', 'uninstalling'];
