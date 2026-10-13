export type TimeEntryLike = {
  id: string;
  memberId: string;
  endedAt: string | null;
};

// T-6: у участника не больше одного активного таймера. Возвращает активные
// записи, которые надо остановить перед стартом нового.
export const findActiveTimersToStop = ({
  entries,
  memberId,
}: {
  entries: TimeEntryLike[];
  memberId: string;
}): TimeEntryLike[] =>
  entries.filter(
    (entry) => entry.memberId === memberId && entry.endedAt === null,
  );

export const computeDurationMinutes = ({
  startedAt,
  endedAt,
}: {
  startedAt: string;
  endedAt: string;
}): number =>
  Math.max(
    0,
    Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 60000),
  );

export const sumDurationMinutes = (
  entries: { durationMinutes?: number | null }[],
): number =>
  entries.reduce((total, entry) => total + (entry.durationMinutes ?? 0), 0);
