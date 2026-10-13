import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { SmbBitrixPortalService } from 'src/modules/smb-bitrix/services/smb-bitrix-portal.service';
import { SmbBitrixTenantService } from 'src/modules/smb-bitrix/services/smb-bitrix-tenant.service';

type SmbBitrixBindPortalCommandOptions = {
  memberId: string;
  workspaceId: string;
};

// With automatic workspace creation switched off (ADR-015, item 11) an
// installed portal stays PENDING until an operator attaches it to a workspace.
@Command({
  name: 'smb:bitrix:bind-portal',
  description: 'Attach an installed Bitrix24 portal to a workspace',
})
export class SmbBitrixBindPortalCommand extends CommandRunner {
  private readonly logger = new Logger(SmbBitrixBindPortalCommand.name);

  constructor(
    private readonly portalService: SmbBitrixPortalService,
    private readonly tenantService: SmbBitrixTenantService,
  ) {
    super();
  }

  async run(
    _passedParams: string[],
    options: SmbBitrixBindPortalCommandOptions,
  ): Promise<void> {
    const portal = await this.portalService.findByMemberId(options.memberId);

    if (!isDefined(portal)) {
      this.logger.error(
        `No Bitrix24 portal with member_id ${options.memberId}: the application has to be installed on the portal first`,
      );
      process.exitCode = 1;

      return;
    }

    const workspace = await this.tenantService.findWorkspace(
      options.workspaceId,
    );

    if (!isDefined(workspace)) {
      this.logger.error(`No workspace with id ${options.workspaceId}`);
      process.exitCode = 1;

      return;
    }

    const boundPortal = await this.portalService.bindToWorkspace(
      portal.id,
      workspace.id,
    );

    await this.tenantService.allowPortalToEmbed(workspace.id, portal.domain);

    this.logger.log(
      `Portal ${boundPortal.domain} (${boundPortal.memberId}) is ${boundPortal.status} in workspace ${workspace.id}`,
    );
  }

  @Option({
    flags: '-m, --member-id <memberId>',
    description: 'member_id of the Bitrix24 portal',
    required: true,
  })
  parseMemberId(value: string): string {
    return value;
  }

  @Option({
    flags: '-w, --workspace-id <workspaceId>',
    description: 'Workspace the portal belongs to',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }
}
