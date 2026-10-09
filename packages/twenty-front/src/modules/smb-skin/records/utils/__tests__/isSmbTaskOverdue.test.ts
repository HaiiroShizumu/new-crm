import { isSmbTaskOverdue } from '@/smb-skin/records/utils/isSmbTaskOverdue';

describe('isSmbTaskOverdue', () => {
  const pastDate = new Date(Date.now() - 86_400_000).toISOString();
  const futureDate = new Date(Date.now() + 86_400_000).toISOString();

  it('flags an open task past its due date', () => {
    expect(isSmbTaskOverdue({ dueAt: pastDate, status: 'TODO' })).toBe(true);
  });

  it('never flags a done task', () => {
    expect(isSmbTaskOverdue({ dueAt: pastDate, status: 'DONE' })).toBe(false);
  });

  it('ignores future and missing due dates', () => {
    expect(isSmbTaskOverdue({ dueAt: futureDate, status: 'TODO' })).toBe(false);
    expect(isSmbTaskOverdue({ dueAt: null, status: 'TODO' })).toBe(false);
  });
});
