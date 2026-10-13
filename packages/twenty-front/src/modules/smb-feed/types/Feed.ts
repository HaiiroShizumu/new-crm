export type FeedAudience = 'COMPANY' | 'DEPARTMENTS';

export type FeedPost = {
  id: string;
  title: string;
  text: string;
  audience: FeedAudience;
  audienceDepartmentIds: string[];
  isPinned: boolean;
  isImportant: boolean;
  publishedAt: string | null;
  authorId: string | null;
};
