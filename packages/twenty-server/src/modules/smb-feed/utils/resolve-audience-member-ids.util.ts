export type FeedAudienceMember = {
  id: string;
  departmentId: string | null;
};

// Кому адресован пост. Аудитория «отдел» — фильтр показа и рассылки, а не
// защита: прочитать пост через API может любой участник (ADR-013 п.5, F-2).
export const resolveAudienceMemberIds = ({
  audience,
  audienceDepartmentIds,
  members,
  authorId,
}: {
  audience: string | null | undefined;
  audienceDepartmentIds: string[] | null | undefined;
  members: FeedAudienceMember[];
  authorId?: string | null;
}): string[] => {
  const departmentIds = new Set(audienceDepartmentIds ?? []);

  return members
    .filter((member) => member.id !== authorId)
    .filter(
      (member) =>
        audience !== 'DEPARTMENTS' ||
        (member.departmentId !== null &&
          departmentIds.has(member.departmentId)),
    )
    .map((member) => member.id);
};

// Кто из аудитории ещё не ознакомился (F-4: список автору и администратору).
export const findUnacknowledgedMemberIds = ({
  audienceMemberIds,
  acknowledgedMemberIds,
}: {
  audienceMemberIds: string[];
  acknowledgedMemberIds: string[];
}): string[] => {
  const acknowledged = new Set(acknowledgedMemberIds);

  return audienceMemberIds.filter((memberId) => !acknowledged.has(memberId));
};
