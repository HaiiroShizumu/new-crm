import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Int, Mutation, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PermissionsGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-graphql-api-exception.filter';
import { SmbNotificationEntity } from 'src/modules/smb-notifications/entities/smb-notification.entity';
import { SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';
import { assertSmbNotificationAccess } from 'src/modules/smb-notifications/utils/assert-smb-notification-access.util';

// Корневые имена с префиксом `smb`: в ядровой схеме включён запрет на
// дублирующиеся root-резолверы, а своё место в `core` схеме модуль получит
// швом в CoreEngineModule (см. отчёт S7/N-1).
@CoreResolver(() => SmbNotificationEntity)
@UseFilters(AuthGraphqlApiExceptionFilter, PermissionsGraphqlApiExceptionFilter)
// Права на уведомления — личные данные участника: отдельное право не нужно
// (NoPermissionGuard), доступ ограничен контекстом компании и участника.
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: true,
    oauthClient: true,
    application: true,
  }),
  NoPermissionGuard,
)
@UsePipes(ResolverValidationPipe)
export class SmbNotificationResolver {
  constructor(
    private readonly smbNotificationService: SmbNotificationService,
  ) {}

  @Query(() => [SmbNotificationEntity])
  async smbNotifications(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
    @Args('limit', { type: () => Int, nullable: true })
    limit: number | null,
    @Args('offset', { type: () => Int, nullable: true })
    offset: number | null,
  ): Promise<SmbNotificationEntity[]> {
    const access = assertSmbNotificationAccess({
      workspaceId: workspace?.id,
      workspaceMemberId,
    });

    return this.smbNotificationService.list({
      ...access,
      limit: limit ?? undefined,
      offset: offset ?? undefined,
    });
  }

  @Query(() => Int)
  async smbUnreadNotificationsCount(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): Promise<number> {
    const access = assertSmbNotificationAccess({
      workspaceId: workspace?.id,
      workspaceMemberId,
    });

    return this.smbNotificationService.countUnread(access);
  }

  @Mutation(() => Int)
  async smbMarkAllNotificationsAsRead(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string,
  ): Promise<number> {
    const access = assertSmbNotificationAccess({
      workspaceId: workspace?.id,
      workspaceMemberId,
    });

    return this.smbNotificationService.markAllAsRead(access);
  }
}
