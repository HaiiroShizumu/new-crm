import { type FeedPost } from '@/smb-feed/types/Feed';

// Лента (F-2): закреплённые сверху, внутри групп — новые выше. Фильтр по
// отделу — показ, не защита: через API пост прочитает любой участник
// компании (ADR-013 п.5). Пост «для отделов» виден в фильтре отдела, если тот
// в аудитории; пост «вся компания» — в любом.
export const selectFeedPosts = ({
  posts,
  departmentFilterId = null,
}: {
  posts: FeedPost[];
  departmentFilterId?: string | null;
}): FeedPost[] =>
  posts
    .filter(
      (post) =>
        departmentFilterId === null ||
        post.audience === 'COMPANY' ||
        post.audienceDepartmentIds.includes(departmentFilterId),
    )
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return left.isPinned ? -1 : 1;
      }

      return (right.publishedAt ?? '').localeCompare(left.publishedAt ?? '');
    });

// Кому ещё нужно нажать «Ознакомлен»: пост важный и участник его не отметил.
export const isAcknowledgementRequired = ({
  post,
  acknowledgedPostIds,
}: {
  post: FeedPost;
  acknowledgedPostIds: ReadonlySet<string>;
}): boolean => post.isImportant && !acknowledgedPostIds.has(post.id);
