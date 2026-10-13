import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { FeedPostImportantPostQueryHook } from 'src/modules/smb-feed/hooks/feed-post-important.post-query.hook';
import { type SmbFeedService } from 'src/modules/smb-feed/services/smb-feed.service';
import {
  findUnacknowledgedMemberIds,
  resolveAudienceMemberIds,
} from 'src/modules/smb-feed/utils/resolve-audience-member-ids.util';

const members = [
  { id: 'a', departmentId: 'sales' },
  { id: 'b', departmentId: 'hr' },
  { id: 'c', departmentId: null },
];

describe('resolveAudienceMemberIds (F-4)', () => {
  it('вся компания — все, кроме автора', () => {
    expect(
      resolveAudienceMemberIds({
        audience: 'COMPANY',
        audienceDepartmentIds: null,
        members,
        authorId: 'a',
      }),
    ).toEqual(['b', 'c']);
  });

  it('отделы — только участники выбранных отделов', () => {
    expect(
      resolveAudienceMemberIds({
        audience: 'DEPARTMENTS',
        audienceDepartmentIds: ['hr'],
        members,
      }),
    ).toEqual(['b']);
  });

  it('аудитория «отделы» без списка отделов никому не адресована', () => {
    expect(
      resolveAudienceMemberIds({
        audience: 'DEPARTMENTS',
        audienceDepartmentIds: null,
        members,
      }),
    ).toEqual([]);
  });
});

describe('findUnacknowledgedMemberIds (F-4)', () => {
  it('исключает ознакомившихся', () => {
    expect(
      findUnacknowledgedMemberIds({
        audienceMemberIds: ['a', 'b', 'c'],
        acknowledgedMemberIds: ['b'],
      }),
    ).toEqual(['a', 'c']);
  });
});

describe('FeedPostImportantPostQueryHook', () => {
  it('уведомляет аудиторию по каждому созданному посту', async () => {
    const notifyImportantPostAudience = jest.fn().mockResolvedValue(2);
    const hook = new FeedPostImportantPostQueryHook({
      notifyImportantPostAudience,
    } as unknown as SmbFeedService);
    const authContext = {} as WorkspaceAuthContext;

    await hook.execute(authContext, 'feedPost', {
      id: 'p1',
      isImportant: true,
    });

    expect(notifyImportantPostAudience).toHaveBeenCalledWith(authContext, {
      id: 'p1',
      isImportant: true,
    });
  });
});
