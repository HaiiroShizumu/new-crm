import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type FeedAudience, type FeedPost } from '@/smb-feed/types/Feed';

const FEED_RECORDS_LIMIT = 200;

type FeedPostRecord = {
  id: string;
  title?: string | null;
  text?: string | null;
  audience?: FeedAudience | null;
  audienceDepartmentIds?: string[] | null;
  isPinned?: boolean | null;
  isImportant?: boolean | null;
  publishedAt?: string | null;
  authorId?: string | null;
};

type AcknowledgementRecord = { postId?: string | null };

export const useFeedData = ({
  currentMemberId,
}: {
  currentMemberId: string | null;
}) => {
  const { records: postRecords, loading: isPostsLoading } =
    useFindManyRecords<FeedPostRecord>({
      objectNameSingular: 'feedPost',
      limit: FEED_RECORDS_LIMIT,
      recordGqlFields: {
        id: true,
        title: true,
        text: true,
        audience: true,
        audienceDepartmentIds: true,
        isPinned: true,
        isImportant: true,
        publishedAt: true,
        authorId: true,
      },
    });

  const { records: acknowledgementRecords } =
    useFindManyRecords<AcknowledgementRecord>({
      objectNameSingular: 'feedAcknowledgement',
      limit: FEED_RECORDS_LIMIT,
      skip: currentMemberId === null,
      filter:
        currentMemberId === null
          ? undefined
          : { memberId: { eq: currentMemberId } },
      recordGqlFields: { id: true, postId: true },
    });

  const posts = useMemo<FeedPost[]>(
    () =>
      postRecords.map((record) => ({
        id: record.id,
        title: record.title ?? '',
        text: record.text ?? '',
        audience: record.audience ?? 'COMPANY',
        audienceDepartmentIds: record.audienceDepartmentIds ?? [],
        isPinned: record.isPinned === true,
        isImportant: record.isImportant === true,
        publishedAt: record.publishedAt ?? null,
        authorId: record.authorId ?? null,
      })),
    [postRecords],
  );

  const acknowledgedPostIds = useMemo(
    () =>
      new Set(
        acknowledgementRecords
          .map((record) => record.postId)
          .filter((postId): postId is string => typeof postId === 'string'),
      ),
    [acknowledgementRecords],
  );

  return { posts, acknowledgedPostIds, isLoading: isPostsLoading };
};
