import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { SmbFeedService } from 'src/modules/smb-feed/services/smb-feed.service';

type FeedPostPayload = Parameters<
  SmbFeedService['notifyImportantPostAudience']
>[1];

// F-4: созданный «важный» пост уведомляет аудиторию.
@WorkspaceQueryHook({
  key: 'feedPost.createOne',
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class FeedPostImportantPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(private readonly feedService: SmbFeedService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: FeedPostPayload[] | FeedPostPayload,
  ): Promise<void> {
    const posts = Array.isArray(payload) ? payload : [payload];

    for (const post of posts) {
      await this.feedService.notifyImportantPostAudience(authContext, post);
    }
  }
}
