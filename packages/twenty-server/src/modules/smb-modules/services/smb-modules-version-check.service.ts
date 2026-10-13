import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, type Repository } from 'typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { SMB_SERVER_MODULE_MANIFESTS } from 'src/modules/smb-modules/registry';
import {
  setSmbModulesVersionStatus,
  type SmbModulesVersionMismatch,
} from 'src/modules/smb-modules/utils/smb-modules-version-status';

// M-7: при старте сервера сверяет версию установленного App с версией,
// зашитой в код образа (expectedVersion в реестре модулей). Расхождение —
// предупреждение в журнале и в ответе health, сервер при этом продолжает
// работать: это сигнал «образ и БД не согласованы», а не отказ.
@Injectable()
export class SmbModulesVersionCheckService implements OnModuleInit {
  private readonly logger = new Logger(SmbModulesVersionCheckService.name);

  constructor(
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository -- сверка M-7 идёт по всем компаниям инстанса сразу, а обёртка workspace-scope требует workspaceId на каждый вызов
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (SMB_SERVER_MODULE_MANIFESTS.length === 0) {
      this.logger.log(
        '[M-7] Реестр smb-модулей пуст — сверка версий App не выполнялась.',
      );

      return;
    }

    try {
      const mismatches = await this.collectMismatches();

      setSmbModulesVersionStatus({
        checkedAt: new Date().toISOString(),
        mismatches,
      });

      if (mismatches.length === 0) {
        this.logger.log(
          `[M-7] Сверка версий App: ${SMB_SERVER_MODULE_MANIFESTS.length} модуль(ей), расхождений нет.`,
        );

        return;
      }

      for (const mismatch of mismatches) {
        this.logger.warn(
          `[M-7] Модуль '${mismatch.key}': в коде образа v${mismatch.expectedVersion}, установлено ${mismatch.installedVersions
            .map(
              (installed) =>
                `v${installed.version ?? 'null'} (workspace ${installed.workspaceId}, ${installed.state})`,
            )
            .join(', ')} — образ и БД не согласованы.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[M-7] Сверка версий App не выполнена: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async collectMismatches(): Promise<SmbModulesVersionMismatch[]> {
    const applications = await this.applicationRepository.find({
      where: {
        universalIdentifier: In(
          SMB_SERVER_MODULE_MANIFESTS.map(
            (manifest) => manifest.applicationUniversalIdentifier,
          ),
        ),
        state: ApplicationState.INSTALLED,
      },
      select: [
        'id',
        'universalIdentifier',
        'workspaceId',
        'version',
        'state',
        'deletedAt',
      ],
    });

    return SMB_SERVER_MODULE_MANIFESTS.flatMap((manifest) => {
      const installedApplications = applications.filter(
        (application) =>
          application.universalIdentifier ===
          manifest.applicationUniversalIdentifier,
      );

      if (installedApplications.length === 0) {
        // App не установлен нигде — сравнивать не с чем, предупреждение
        // появится, как только модуль установят на несовпадающую версию.
        return [];
      }

      const driftedApplications = installedApplications.filter(
        (application) => application.version !== manifest.expectedVersion,
      );

      if (driftedApplications.length === 0) {
        return [];
      }

      return [
        {
          key: manifest.key,
          applicationUniversalIdentifier:
            manifest.applicationUniversalIdentifier,
          expectedVersion: manifest.expectedVersion,
          installedVersions: driftedApplications.map((application) => ({
            workspaceId: application.workspaceId,
            version: application.version,
            state: application.state,
          })),
        },
      ];
    });
  }
}
