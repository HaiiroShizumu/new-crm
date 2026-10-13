import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { RESOLVER_SCHEMA_SCOPE_KEY } from 'src/engine/api/graphql/graphql-config/constants/resolver-schema-scope-key.constant';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { SmbNotificationResolver } from 'src/modules/smb-notifications/resolvers/smb-notification.resolver';
import { type SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';

const WORKSPACE_ID = '20202020-aaaa-4111-8111-111111111111';
const RECIPIENT_ID = '20202020-bbbb-4222-8222-222222222222';

const buildResolver = () => {
  const service = {
    list: jest.fn().mockResolvedValue([]),
    countUnread: jest.fn().mockResolvedValue(0),
    markAllAsRead: jest.fn().mockResolvedValue(0),
  };
  const resolver = new SmbNotificationResolver(
    service as unknown as SmbNotificationService,
  );
  const workspace = { id: WORKSPACE_ID } as WorkspaceEntity;

  return { resolver, service, workspace };
};

describe('SmbNotificationResolver', () => {
  it('резолвер отмечен scope core (попадёт в ядровую схему)', () => {
    expect(
      Reflect.getMetadata(RESOLVER_SCHEMA_SCOPE_KEY, SmbNotificationResolver),
    ).toBe('core');
  });

  it('класс защищён AuthPrincipalGuard и явным NoPermissionGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      SmbNotificationResolver,
    ) as unknown[];

    expect(guards).toHaveLength(2);
    // AuthPrincipalGuard(config) возвращает mixin-класс.
    expect(typeof guards[0]).toBe('function');
    expect(guards[1]).toBe(NoPermissionGuard);
  });

  it('список, счётчик и «прочитать всё» получают пару из одной проверки', async () => {
    const { resolver, service, workspace } = buildResolver();

    await resolver.smbNotifications(workspace, RECIPIENT_ID, 10, 0);
    await resolver.smbUnreadNotificationsCount(workspace, RECIPIENT_ID);
    await resolver.smbMarkAllNotificationsAsRead(workspace, RECIPIENT_ID);

    expect(service.list).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
      limit: 10,
      offset: 0,
    });
    expect(service.countUnread).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
    });
    expect(service.markAllAsRead).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
    });
  });

  it('без компании — отказ до обращения к сервису', async () => {
    const { resolver, service } = buildResolver();

    await expect(
      resolver.smbUnreadNotificationsCount(
        undefined as unknown as WorkspaceEntity,
        RECIPIENT_ID,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(service.countUnread).not.toHaveBeenCalled();
  });

  it('без участника — отказ до обращения к сервису', async () => {
    const { resolver, service, workspace } = buildResolver();

    await expect(
      resolver.smbMarkAllNotificationsAsRead(
        workspace,
        undefined as unknown as string,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(service.markAllAsRead).not.toHaveBeenCalled();
  });
});
