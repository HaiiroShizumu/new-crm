import { isSmbDocflowTaskMine } from '@/smb-docflow/utils/isSmbDocflowTaskMine';

describe('isSmbDocflowTaskMine', () => {
  it('is mine when I am the assignee', () => {
    expect(
      isSmbDocflowTaskMine({
        task: { assigneeWorkspaceMemberId: 'me' },
        currentWorkspaceMemberId: 'me',
        runCreatorWorkspaceMemberId: 'someone',
      }),
    ).toBe(true);
  });

  it('is not mine when someone else is the assignee, even in a process I started', () => {
    expect(
      isSmbDocflowTaskMine({
        task: { assigneeWorkspaceMemberId: 'manager' },
        currentWorkspaceMemberId: 'me',
        runCreatorWorkspaceMemberId: 'me',
      }),
    ).toBe(false);
  });

  it('falls to whoever started the process when the step has no assignee', () => {
    expect(
      isSmbDocflowTaskMine({
        task: { assigneeWorkspaceMemberId: undefined },
        currentWorkspaceMemberId: 'me',
        runCreatorWorkspaceMemberId: 'me',
      }),
    ).toBe(true);
    expect(
      isSmbDocflowTaskMine({
        task: { assigneeWorkspaceMemberId: undefined },
        currentWorkspaceMemberId: 'me',
        runCreatorWorkspaceMemberId: undefined,
      }),
    ).toBe(false);
  });
});
