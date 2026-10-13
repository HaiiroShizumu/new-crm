import { Injectable } from '@nestjs/common';
import { isDefined } from 'twenty-shared/utils';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { SMB_MODULES_CACHE_TTL_MS } from 'src/modules/smb-modules/constants/smb-modules-cache-ttl.constant';
import { isSmbModuleApplicationEnabled } from 'src/modules/smb-modules/utils/is-smb-module-application-enabled.util';

type EnabledApplicationsCacheEntry = {
  expiresAt: number;
  universalIdentifiers: ReadonlySet<string>;
};

// Кэш «какие App установлены в компании» — источник правды для guard'а
// (ADR-009 п.3): тот же список, что читает фронт через
// filterEnabledSmbModules, только с серверными правилами RV-2.
@Injectable()
export class SmbInstalledApplicationsCacheService {
  private readonly entriesByWorkspaceId = new Map<
    string,
    EnabledApplicationsCacheEntry
  >();

  // Дедупликация одновременных первых запросов к одной компании, чтобы не
  // устраивать несколько одинаковых SELECT под нагрузкой.
  private readonly pendingByWorkspaceId = new Map<
    string,
    Promise<ReadonlySet<string>>
  >();

  constructor(
    @InjectWorkspaceScopedRepository(ApplicationEntity)
    private readonly applicationRepository: WorkspaceScopedRepository<ApplicationEntity>,
  ) {}

  async isModuleEnabled({
    workspaceId,
    universalIdentifier,
  }: {
    workspaceId: string;
    universalIdentifier: string;
  }): Promise<boolean> {
    const enabledUniversalIdentifiers =
      await this.getEnabledUniversalIdentifiers(workspaceId);

    return enabledUniversalIdentifiers.has(universalIdentifier);
  }

  // Инвалидация из нашего кода (команды M-6); в другом процессе её вызвать
  // нельзя — там работает только TTL.
  invalidate(workspaceId?: string): void {
    if (isDefined(workspaceId)) {
      this.entriesByWorkspaceId.delete(workspaceId);

      return;
    }

    this.entriesByWorkspaceId.clear();
    this.pendingByWorkspaceId.clear();
  }

  private async getEnabledUniversalIdentifiers(
    workspaceId: string,
  ): Promise<ReadonlySet<string>> {
    const entry = this.entriesByWorkspaceId.get(workspaceId);

    if (isDefined(entry) && entry.expiresAt > Date.now()) {
      return entry.universalIdentifiers;
    }

    const pending = this.pendingByWorkspaceId.get(workspaceId);

    if (isDefined(pending)) {
      return pending;
    }

    const loadPromise = this.load(workspaceId).finally(() => {
      this.pendingByWorkspaceId.delete(workspaceId);
    });

    this.pendingByWorkspaceId.set(workspaceId, loadPromise);

    return loadPromise;
  }

  private async load(workspaceId: string): Promise<ReadonlySet<string>> {
    // workspaceId подставляет обёртка workspace-scope — выборка физически не
    // может выйти за пределы компании.
    const applications = await this.applicationRepository.find(workspaceId, {
      select: ['id', 'universalIdentifier', 'version', 'state', 'deletedAt'],
    });

    const enabledUniversalIdentifiers = new Set(
      applications
        .filter(isSmbModuleApplicationEnabled)
        .map((application) => application.universalIdentifier),
    );

    this.entriesByWorkspaceId.set(workspaceId, {
      expiresAt: Date.now() + SMB_MODULES_CACHE_TTL_MS,
      universalIdentifiers: enabledUniversalIdentifiers,
    });

    return enabledUniversalIdentifiers;
  }
}
