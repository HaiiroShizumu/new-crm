import { type FeedPost } from '@/smb-feed/types/Feed';
import {
  isAcknowledgementRequired,
  selectFeedPosts,
} from '@/smb-feed/utils/selectFeedPosts';

const post = (id: string, overrides: Partial<FeedPost> = {}): FeedPost => ({
  id,
  title: id,
  text: '',
  audience: 'COMPANY',
  audienceDepartmentIds: [],
  isPinned: false,
  isImportant: false,
  publishedAt: '2026-10-01T10:00:00Z',
  authorId: null,
  ...overrides,
});

describe('selectFeedPosts (F-2)', () => {
  it('закреплённые сверху, внутри — новые выше', () => {
    const result = selectFeedPosts({
      posts: [
        post('old', { publishedAt: '2026-09-01T00:00:00Z' }),
        post('new', { publishedAt: '2026-10-05T00:00:00Z' }),
        post('pinned-old', {
          isPinned: true,
          publishedAt: '2026-08-01T00:00:00Z',
        }),
      ],
    });

    expect(result.map((item) => item.id)).toEqual(['pinned-old', 'new', 'old']);
  });

  it('фильтр по отделу оставляет посты компании и посты этого отдела', () => {
    const result = selectFeedPosts({
      posts: [
        post('company'),
        post('sales', {
          audience: 'DEPARTMENTS',
          audienceDepartmentIds: ['sales'],
        }),
        post('hr', { audience: 'DEPARTMENTS', audienceDepartmentIds: ['hr'] }),
      ],
      departmentFilterId: 'sales',
    });

    expect(result.map((item) => item.id).sort()).toEqual(['company', 'sales']);
  });
});

describe('isAcknowledgementRequired (F-4)', () => {
  it('требуется только для важного поста без отметки', () => {
    const acknowledged = new Set(['p2']);

    expect(
      isAcknowledgementRequired({
        post: post('p1', { isImportant: true }),
        acknowledgedPostIds: acknowledged,
      }),
    ).toBe(true);
    expect(
      isAcknowledgementRequired({
        post: post('p2', { isImportant: true }),
        acknowledgedPostIds: acknowledged,
      }),
    ).toBe(false);
    expect(
      isAcknowledgementRequired({
        post: post('p3'),
        acknowledgedPostIds: acknowledged,
      }),
    ).toBe(false);
  });
});
