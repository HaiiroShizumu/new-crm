import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { SignInUpService } from 'src/engine/core-modules/auth/services/sign-in-up.service';
import { SubdomainManagerService } from 'src/engine/core-modules/domain/subdomain-manager/services/subdomain-manager.service';
import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';
import { buildSmbBitrixSubdomain } from 'src/modules/smb-bitrix/utils/build-smb-bitrix-subdomain.util';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { fromUserEntityToFlat } from 'src/engine/core-modules/user/utils/from-user-entity-to-flat.util';
import { WorkspaceService } from 'src/engine/core-modules/workspace/services/workspace.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class SmbBitrixTenantService {
  private readonly logger = new Logger(SmbBitrixTenantService.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly signInUpService: SignInUpService,
    private readonly workspaceService: WorkspaceService,
    private readonly subdomainManagerService: SubdomainManagerService,
    private readonly onboardingService: OnboardingService,
  ) {}

  async findWorkspace(workspaceId: string): Promise<WorkspaceEntity | null> {
    return this.workspaceRepository.findOne({ where: { id: workspaceId } });
  }

  // Creates a workspace for a freshly installed portal through the same two
  // steps a person goes through in the interface: sign up, then activate.
  // Every instance limit of the core (workspace count, creation restricted to
  // server admins) still applies and surfaces here as an exception.
  async createWorkspaceForPortal({
    portal,
    owner,
  }: {
    portal: SmbBitrixPortalRow;
    owner: UserEntity;
  }): Promise<WorkspaceEntity> {
    const { workspace } = await this.signInUpService.signUpOnNewWorkspace(
      { type: 'existingUser', existingUser: owner },
      {
        displayName: portal.domain,
        subdomain: await this.pickSubdomain(portal.domain),
      },
    );

    const activatedWorkspace = await this.workspaceService.activateWorkspace(
      fromUserEntityToFlat(owner),
      workspace,
    );

    await this.skipOwnerOnboarding(owner.id, workspace.id);

    return activatedWorkspace ?? workspace;
  }

  async allowPortalToEmbed(
    workspaceId: string,
    portalDomain: string,
  ): Promise<void> {
    try {
      await this.workspaceService.updateWorkspaceAllowedIframeOrigins(
        workspaceId,
        { origin: `https://${portalDomain}`, operation: 'add' },
      );
    } catch (error) {
      // Not fatal for the install: the administrator can add the origin by
      // hand in Settings -> Security, and the reason is kept in the log.
      this.logger.error(
        `Could not allow ${portalDomain} to embed workspace ${workspaceId}`,
        error,
      );
    }
  }

  private async pickSubdomain(
    portalDomain: string,
  ): Promise<string | undefined> {
    const subdomain = buildSmbBitrixSubdomain(portalDomain);

    if (!isDefined(subdomain)) {
      return undefined;
    }

    try {
      await this.subdomainManagerService.validateSubdomainOrThrow(subdomain);

      return subdomain;
    } catch {
      // Taken or reserved: the core generates a free one instead.
      return undefined;
    }
  }

  // The owner arrived from Bitrix24 with a name and a team already in place;
  // the setup wizard of a self-registered workspace does not apply.
  private async skipOwnerOnboarding(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.onboardingService.setOnboardingConnectAccountPending({
      userId,
      workspaceId,
      value: false,
    });
    await this.onboardingService.setOnboardingCreateProfilePending({
      userId,
      workspaceId,
      value: false,
    });
    await this.onboardingService.setOnboardingInstallAppsPending({
      userId,
      workspaceId,
      value: false,
    });
    await this.onboardingService.setOnboardingInviteTeamPending({
      workspaceId,
      value: false,
    });
  }
}
