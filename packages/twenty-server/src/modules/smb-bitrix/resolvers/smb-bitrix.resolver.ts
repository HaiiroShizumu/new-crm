import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { type AuthContextUser } from 'src/engine/core-modules/auth/types/auth-context.type';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { SmbBitrixCrmLinkDTO } from 'src/modules/smb-bitrix/dtos/smb-bitrix-crm-link.dto';
import { SmbBitrixCrmLinkService } from 'src/modules/smb-bitrix/services/smb-bitrix-crm-link.service';
import { SmbBitrixUserService } from 'src/modules/smb-bitrix/services/smb-bitrix-user.service';
import { SmbBitrixExceptionFilter } from 'src/modules/smb-bitrix/smb-bitrix-exception.filter';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUser } from 'src/engine/decorators/auth/auth-user.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';

// NoPermissionGuard: a person only ever gets a link to their own account.
// People only. An impersonated session is refused on purpose: the link signs
// in or sets a password, and support staff must get neither for a user.
@CoreResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
@UsePipes(ResolverValidationPipe)
@UseFilters(
  SmbBitrixExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
  AuthGraphqlApiExceptionFilter,
)
export class SmbBitrixResolver {
  constructor(
    private readonly crmLinkService: SmbBitrixCrmLinkService,
    private readonly bitrixUserService: SmbBitrixUserService,
  ) {}

  @Query(() => Boolean)
  async isSmbBitrixUser(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<boolean> {
    return this.bitrixUserService.isBitrixUser({
      userId: user.id,
      workspaceId: workspace.id,
    });
  }

  @Mutation(() => SmbBitrixCrmLinkDTO)
  async createSmbBitrixCrmLink(
    @AuthUser() user: AuthContextUser,
    @AuthWorkspace() workspace: WorkspaceEntity,
  ): Promise<SmbBitrixCrmLinkDTO> {
    return {
      url: await this.crmLinkService.createCrmLink({
        userId: user.id,
        workspace,
      }),
    };
  }
}
