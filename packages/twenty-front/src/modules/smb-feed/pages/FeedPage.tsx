import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { useMemo, useState, type FormEvent } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFeedData } from '@/smb-feed/hooks/useFeedData';
import {
  isAcknowledgementRequired,
  selectFeedPosts,
} from '@/smb-feed/utils/selectFeedPosts';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  height: 100%;
  margin: 0 auto;
  max-width: 720px;
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPost = styled.article<{ isPinned: boolean }>`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-left-width: ${({ isPinned }) => (isPinned ? '4px' : '1px')};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMeta = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type DepartmentRecord = { id: string; name?: string | null };

export const FeedPage = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const currentMemberId = currentWorkspaceMember?.id ?? null;
  const { posts, acknowledgedPostIds, isLoading } = useFeedData({
    currentMemberId,
  });
  const { records: departments } = useFindManyRecords<DepartmentRecord>({
    objectNameSingular: 'department',
    recordGqlFields: { id: true, name: true },
  });
  const { createOneRecord: createPost } = useCreateOneRecord({
    objectNameSingular: 'feedPost',
  });
  const { createOneRecord: createAcknowledgement } = useCreateOneRecord({
    objectNameSingular: 'feedAcknowledgement',
  });

  const [departmentFilterId, setDepartmentFilterId] = useState<string | null>(
    null,
  );
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const visiblePosts = useMemo(
    () => selectFeedPosts({ posts, departmentFilterId }),
    [posts, departmentFilterId],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (title.trim() === '') {
      return;
    }

    await createPost({
      title,
      text,
      audience: 'COMPANY',
      isImportant,
      isPinned,
      publishedAt: new Date().toISOString(),
      authorId: currentMemberId,
    });

    setTitle('');
    setText('');
    setIsImportant(false);
    setIsPinned(false);
  };

  const handleAcknowledge = async (postId: string, postTitle: string) => {
    await createAcknowledgement({
      label: postTitle,
      postId,
      memberId: currentMemberId,
      acknowledgedAt: new Date().toISOString(),
    });
  };

  return (
    <StyledPage>
      <StyledForm onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Заголовок"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Текст"
          rows={3}
        />
        <label>
          <input
            type="checkbox"
            checked={isImportant}
            onChange={(event) => setIsImportant(event.target.checked)}
          />{' '}
          <Trans>Важное: требуется ознакомление</Trans>
        </label>
        <label>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
          />{' '}
          <Trans>Закрепить</Trans>
        </label>
        <button type="submit">
          <Trans>Опубликовать</Trans>
        </button>
      </StyledForm>
      <select
        value={departmentFilterId ?? ''}
        onChange={(event) =>
          setDepartmentFilterId(
            event.target.value === '' ? null : event.target.value,
          )
        }
      >
        <option value="">Все отделы</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      {isLoading && <Trans>Загрузка…</Trans>}
      {visiblePosts.map((post) => (
        <StyledPost key={post.id} isPinned={post.isPinned}>
          <strong>{post.title}</strong>
          <div>{post.text}</div>
          <StyledMeta>
            {post.publishedAt?.slice(0, 10)}
            {post.isImportant ? ' · важное' : ''}
          </StyledMeta>
          {isAcknowledgementRequired({ post, acknowledgedPostIds }) && (
            <button
              type="button"
              onClick={() => void handleAcknowledge(post.id, post.title)}
            >
              <Trans>Ознакомлен</Trans>
            </button>
          )}
        </StyledPost>
      ))}
    </StyledPage>
  );
};
