import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { SMB_BITRIX_EXPANDED_OPTION } from 'src/modules/smb-bitrix/constants/smb-bitrix-expanded-option.constant';
import { SMB_BITRIX_DOCFLOW_PATH } from 'src/modules/smb-bitrix/constants/smb-bitrix-docflow-path.constant';
import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';
import { SmbBitrixOauthService } from 'src/modules/smb-bitrix/services/smb-bitrix-oauth.service';
import { SmbBitrixPortalService } from 'src/modules/smb-bitrix/services/smb-bitrix-portal.service';
import { SmbBitrixRestService } from 'src/modules/smb-bitrix/services/smb-bitrix-rest.service';
import { SmbBitrixUserService } from 'src/modules/smb-bitrix/services/smb-bitrix-user.service';
import { SmbBitrixTenantService } from 'src/modules/smb-bitrix/services/smb-bitrix-tenant.service';
import {
  SmbBitrixException,
  SmbBitrixExceptionCode,
} from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { type SmbBitrixGrant } from 'src/modules/smb-bitrix/types/smb-bitrix-grant.type';
import { type SmbBitrixInstallResult } from 'src/modules/smb-bitrix/types/smb-bitrix-install-result.type';
import { type SmbBitrixLaunchBody } from 'src/modules/smb-bitrix/types/smb-bitrix-launch-body.type';
import { type SmbBitrixPerson } from 'src/modules/smb-bitrix/types/smb-bitrix-person.type';
import { SmbConfigService } from 'src/modules/smb-config/smb-config.service';
import { type UserEntity } from 'src/engine/core-modules/user/user.entity';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class SmbBitrixLaunchService {
  private readonly logger = new Logger(SmbBitrixLaunchService.name);

  constructor(
    private readonly oauthService: SmbBitrixOauthService,
    private readonly restService: SmbBitrixRestService,
    private readonly portalService: SmbBitrixPortalService,
    private readonly userService: SmbBitrixUserService,
    private readonly tenantService: SmbBitrixTenantService,
    private readonly loginTokenService: LoginTokenService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
    private readonly smbConfigService: SmbConfigService,
  ) {}

  async install(body: SmbBitrixLaunchBody): Promise<SmbBitrixInstallResult> {
    const grant = await this.proveRequest(body);

    if (!(await this.restService.isCurrentPersonAdmin(grant))) {
      throw new SmbBitrixException(
        `Portal ${grant.memberId}: install attempted by a non-administrator`,
        SmbBitrixExceptionCode.ADMIN_REQUIRED,
      );
    }

    let portal = await this.portalService.upsertFromGrant(grant);

    if (
      !isDefined(portal.workspaceId) &&
      this.smbConfigService.bitrix?.shouldAutoProvisionWorkspace === true
    ) {
      portal = await this.provisionWorkspace(portal, grant);
    }

    if (!isDefined(portal.workspaceId)) {
      return { isActive: false };
    }

    await this.portalService.markReinstalled(portal.id);
    await this.tenantService.allowPortalToEmbed(
      portal.workspaceId,
      portal.domain,
    );

    // Not awaited: Bitrix24 waits for this page, and a portal of a few hundred
    // people takes minutes. Anyone the sync has not reached yet is created on
    // their first opening of the application instead.
    void this.syncEmployees(portal, grant);

    return { isActive: true };
  }

  // Returns the address the iframe is sent to: the workspace of the portal,
  // already signed in as the employee who opened the application.
  async open(body: SmbBitrixLaunchBody): Promise<string> {
    const grant = await this.proveRequest(body);
    const portal = await this.portalService.upsertFromGrant(grant);

    if (!isDefined(portal.workspaceId)) {
      throw new SmbBitrixException(
        `Portal ${grant.memberId} has no workspace`,
        portal.status === 'PENDING'
          ? SmbBitrixExceptionCode.PORTAL_NOT_ACTIVE
          : SmbBitrixExceptionCode.PORTAL_NOT_INSTALLED,
      );
    }

    const workspace = await this.tenantService.findWorkspace(
      portal.workspaceId,
    );

    if (!isDefined(workspace)) {
      throw new SmbBitrixException(
        `Portal ${grant.memberId}: workspace ${portal.workspaceId} is gone`,
        SmbBitrixExceptionCode.PORTAL_NOT_INSTALLED,
      );
    }

    // A valid grant means the application is installed on the portal again,
    // even if the install page was not shown this time.
    await this.portalService.markReinstalled(portal.id);

    const user = await this.resolveCurrentUser({ portal, workspace, grant });

    const loginToken = await this.loginTokenService.generateLoginToken(
      user.email,
      workspace.id,
      AuthProviderEnum.Password,
    );

    return this.workspaceDomainsService
      .buildWorkspaceURL({
        workspace,
        pathname: AppPath.Verify,
        searchParams: {
          loginToken: loginToken.token,
          returnToPath: body.isExpanded
            ? `${SMB_BITRIX_DOCFLOW_PATH}?${SMB_BITRIX_EXPANDED_OPTION}=1`
            : SMB_BITRIX_DOCFLOW_PATH,
        },
      })
      .toString();
  }

  async handleEvent(body: SmbBitrixLaunchBody): Promise<void> {
    if (body.eventName === 'ONAPPINSTALL') {
      const grant = await this.proveRequest(body);
      const portal = await this.portalService.upsertFromGrant(grant);

      if (isNonEmptyString(body.applicationToken)) {
        await this.portalService.saveApplicationTokenIfAbsent(
          portal,
          body.applicationToken,
        );
      }

      return;
    }

    if (body.eventName === 'ONAPPUNINSTALL') {
      // The uninstall event carries no OAuth tokens: the application token
      // stored at install time is the only thing that proves it.
      const portal = isNonEmptyString(body.memberId)
        ? await this.portalService.findByMemberId(body.memberId)
        : null;

      if (
        !isDefined(portal) ||
        !this.portalService.isApplicationTokenValid(
          portal,
          body.applicationToken,
        )
      ) {
        throw new SmbBitrixException(
          'Uninstall event without a matching application token',
          SmbBitrixExceptionCode.PORTAL_PROOF_FAILED,
        );
      }

      await this.portalService.markUninstalled(portal.id);
    }
  }

  private async proveRequest(
    body: SmbBitrixLaunchBody,
  ): Promise<SmbBitrixGrant> {
    if (!isNonEmptyString(body.refreshToken)) {
      throw new SmbBitrixException(
        'Request has no refresh token',
        SmbBitrixExceptionCode.INVALID_REQUEST,
      );
    }

    return this.oauthService.exchangeRefreshToken(body.refreshToken);
  }

  private async resolveCurrentUser({
    portal,
    workspace,
    grant,
  }: {
    portal: SmbBitrixPortalRow;
    workspace: WorkspaceEntity;
    grant: SmbBitrixGrant;
  }): Promise<UserEntity> {
    // The portal is asked for the profile only when the employee is new: a
    // known id from the grant is enough, and it saves a request per opening.
    const boundUser = isDefined(grant.bitrixUserId)
      ? await this.userService.findBoundUser({
          portalId: portal.id,
          bitrixUserId: grant.bitrixUserId,
        })
      : null;

    const person: SmbBitrixPerson =
      isDefined(boundUser) && isDefined(grant.bitrixUserId)
        ? {
            bitrixUserId: grant.bitrixUserId,
            email: undefined,
            firstName: '',
            lastName: '',
          }
        : await this.restService.getCurrentPerson(grant);

    const resolution = await this.userService.resolveUser({
      portal,
      workspace,
      person,
    });

    if (resolution.status === 'RESOLVED') {
      return resolution.user;
    }

    throw new SmbBitrixException(
      `Portal ${portal.memberId}: Bitrix24 user ${person.bitrixUserId} not signed in (${resolution.status})`,
      resolution.status === 'EMAIL_MISSING'
        ? SmbBitrixExceptionCode.EMAIL_MISSING
        : SmbBitrixExceptionCode.ACCOUNT_LINK_REQUIRED,
    );
  }

  private async provisionWorkspace(
    portal: SmbBitrixPortalRow,
    grant: SmbBitrixGrant,
  ): Promise<SmbBitrixPortalRow> {
    try {
      const installer = await this.restService.getCurrentPerson(grant);
      const owner = await this.userService.resolveOwnerAccount(installer);

      if (!isDefined(owner)) {
        throw new Error(
          'The installer has no email or already owns an account in another workspace',
        );
      }

      const workspace = await this.tenantService.createWorkspaceForPortal({
        portal,
        owner,
      });
      const boundPortal = await this.portalService.bindToWorkspace(
        portal.id,
        workspace.id,
      );

      await this.userService.resolveUser({
        portal: boundPortal,
        workspace,
        person: installer,
      });

      return boundPortal;
    } catch (error) {
      // The portal stays PENDING with the reason saved; an operator binds it
      // to a workspace by hand.
      this.logger.error(
        `Portal ${portal.memberId}: workspace was not created`,
        error,
      );
      await this.portalService.saveError(portal.id, error);

      return portal;
    }
  }

  private async syncEmployees(
    portal: SmbBitrixPortalRow,
    grant: SmbBitrixGrant,
  ): Promise<void> {
    try {
      if (!isDefined(portal.workspaceId)) {
        return;
      }

      const workspace = await this.tenantService.findWorkspace(
        portal.workspaceId,
      );

      if (!isDefined(workspace)) {
        return;
      }

      const employees = await this.restService.listActiveEmployees(grant);
      let skippedCount = 0;

      // One at a time: each account creates a workspace member and a role
      // assignment, and the install must not starve the people already working.
      for (const person of employees) {
        const resolution = await this.userService.resolveUser({
          portal,
          workspace,
          person,
        });

        if (resolution.status !== 'RESOLVED') {
          skippedCount++;
        }
      }

      await this.portalService.markUsersSynced(portal.id);
      this.logger.log(
        `Portal ${portal.memberId}: ${employees.length - skippedCount} of ${employees.length} employees have an account`,
      );
    } catch (error) {
      this.logger.error(`Portal ${portal.memberId}: user sync failed`, error);
      await this.portalService.saveError(portal.id, error);
    }
  }
}
