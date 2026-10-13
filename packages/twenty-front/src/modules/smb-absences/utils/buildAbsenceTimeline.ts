import {
  type AbsenceDepartment,
  type AbsenceItem,
  type AbsenceMember,
  type AbsenceTimelineGroup,
  type AbsenceType,
} from '@/smb-absences/types/Absence';

const pad = (value: number): string => String(value).padStart(2, '0');

export const getDaysInMonth = (year: number, monthIndex: number): number =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const toIsoDate = (year: number, monthIndex: number, day: number): string =>
  `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

// График отсутствий за месяц (A-2). Строки — сотрудники по отделам, колонки —
// дни. Отклонённые и отменённые отсутствия в график не попадают. Дни, когда в
// одном отделе отсутствуют двое и больше, возвращаются как overlapDays
// (A-3: предупреждение о пересечении внутри отдела — это показ, не запрет).
export const buildAbsenceTimeline = ({
  year,
  monthIndex,
  members,
  departments,
  absences,
  departmentFilterId = null,
  absenceTypeFilter = null,
}: {
  year: number;
  monthIndex: number;
  members: AbsenceMember[];
  departments: AbsenceDepartment[];
  absences: AbsenceItem[];
  departmentFilterId?: string | null;
  absenceTypeFilter?: AbsenceType | null;
}): AbsenceTimelineGroup[] => {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const departmentNameById = new Map(
    departments.map((department) => [department.id, department.name]),
  );

  const visibleAbsences = absences.filter(
    (absence) =>
      absence.status !== 'REJECTED' &&
      absence.status !== 'CANCELLED' &&
      (absenceTypeFilter === null || absence.absenceType === absenceTypeFilter),
  );

  const groupByDepartmentId = new Map<string | null, AbsenceTimelineGroup>();

  const sortedMembers = [...members].sort((left, right) =>
    left.fullName.localeCompare(right.fullName, 'ru'),
  );

  for (const member of sortedMembers) {
    const departmentId =
      member.departmentId !== null &&
      departmentNameById.has(member.departmentId)
        ? member.departmentId
        : null;

    if (departmentFilterId !== null && departmentId !== departmentFilterId) {
      continue;
    }

    const memberAbsences = visibleAbsences.filter(
      (absence) => absence.memberId === member.id,
    );

    const days: (AbsenceType | null)[] = Array.from(
      { length: daysInMonth },
      (_, index) => {
        const date = toIsoDate(year, monthIndex, index + 1);

        return (
          memberAbsences.find(
            (absence) => absence.startDate <= date && date <= absence.endDate,
          )?.absenceType ?? null
        );
      },
    );

    const group = groupByDepartmentId.get(departmentId) ?? {
      departmentId,
      departmentName:
        departmentId === null
          ? ''
          : (departmentNameById.get(departmentId) ?? ''),
      rows: [],
      overlapDays: [],
    };

    group.rows.push({ member, days });
    groupByDepartmentId.set(departmentId, group);
  }

  const groups = [...groupByDepartmentId.values()];

  for (const group of groups) {
    group.overlapDays = Array.from({ length: daysInMonth }, (_, index) => index)
      .filter(
        (dayIndex) =>
          group.rows.filter((row) => row.days[dayIndex] !== null).length >= 2,
      )
      .map((dayIndex) => dayIndex + 1);
  }

  return groups.sort((left, right) => {
    if (left.departmentId === null) {
      return 1;
    }

    if (right.departmentId === null) {
      return -1;
    }

    return left.departmentName.localeCompare(right.departmentName, 'ru');
  });
};
