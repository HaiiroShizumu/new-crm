import { buildAbsenceTimeline } from '@/smb-absences/utils/buildAbsenceTimeline';

const members = [
  { id: 'm1', fullName: 'Антон', departmentId: 'sales' },
  { id: 'm2', fullName: 'Вера', departmentId: 'sales' },
  { id: 'm3', fullName: 'Яна', departmentId: null },
];
const departments = [{ id: 'sales', name: 'Продажи' }];

const absence = (
  id: string,
  memberId: string,
  startDate: string,
  endDate: string,
  overrides: Record<string, string> = {},
) => ({
  id,
  memberId,
  absenceType: 'VACATION' as const,
  status: 'APPROVED' as const,
  startDate,
  endDate,
  ...overrides,
});

describe('buildAbsenceTimeline', () => {
  it('отмечает дни месяца и группирует по отделам, «без отдела» — последним', () => {
    const groups = buildAbsenceTimeline({
      year: 2026,
      monthIndex: 9,
      members,
      departments,
      absences: [absence('a1', 'm1', '2026-10-05', '2026-10-07')],
    });

    expect(groups.map((group) => group.departmentName)).toEqual([
      'Продажи',
      '',
    ]);
    expect(groups[0].rows[0].days.slice(3, 8)).toEqual([
      null,
      'VACATION',
      'VACATION',
      'VACATION',
      null,
    ]);
    expect(groups[0].rows[0].days).toHaveLength(31);
  });

  it('период, начавшийся в прошлом месяце, захватывает начало текущего', () => {
    const [group] = buildAbsenceTimeline({
      year: 2026,
      monthIndex: 9,
      members: [members[0]],
      departments,
      absences: [absence('a1', 'm1', '2026-09-28', '2026-10-02')],
    });

    expect(group.rows[0].days.slice(0, 3)).toEqual([
      'VACATION',
      'VACATION',
      null,
    ]);
  });

  it('отклонённые и отменённые не показываются', () => {
    const [group] = buildAbsenceTimeline({
      year: 2026,
      monthIndex: 9,
      members: [members[0]],
      departments,
      absences: [
        absence('a1', 'm1', '2026-10-05', '2026-10-07', { status: 'REJECTED' }),
        absence('a2', 'm1', '2026-10-10', '2026-10-11', {
          status: 'CANCELLED',
        }),
      ],
    });

    expect(group.rows[0].days.every((day) => day === null)).toBe(true);
  });

  it('дни, когда отсутствуют двое из отдела, помечаются как пересечение', () => {
    const [group] = buildAbsenceTimeline({
      year: 2026,
      monthIndex: 9,
      members: [members[0], members[1]],
      departments,
      absences: [
        absence('a1', 'm1', '2026-10-05', '2026-10-07'),
        absence('a2', 'm2', '2026-10-07', '2026-10-09'),
      ],
    });

    expect(group.overlapDays).toEqual([7]);
  });

  it('фильтры по отделу и типу', () => {
    const groups = buildAbsenceTimeline({
      year: 2026,
      monthIndex: 9,
      members,
      departments,
      absences: [
        absence('a1', 'm1', '2026-10-05', '2026-10-07', {
          absenceType: 'SICK_LEAVE',
        }),
      ],
      departmentFilterId: 'sales',
      absenceTypeFilter: 'VACATION',
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].rows[0].days.every((day) => day === null)).toBe(true);
  });
});
