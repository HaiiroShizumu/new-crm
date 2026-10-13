import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  type AbsenceDepartment,
  type AbsenceItem,
  type AbsenceMember,
  type AbsenceStatus,
  type AbsenceType,
} from '@/smb-absences/types/Absence';

const ABSENCES_RECORDS_LIMIT = 500;

type AbsenceRecord = {
  id: string;
  memberId?: string | null;
  absenceType?: AbsenceType | null;
  status?: AbsenceStatus | null;
  startDate?: string | null;
  endDate?: string | null;
};

type MemberRecord = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  departmentId?: string | null;
};

type DepartmentRecord = { id: string; name?: string | null };

export const useAbsencesData = () => {
  const { records: absenceRecords, loading: isAbsencesLoading } =
    useFindManyRecords<AbsenceRecord>({
      objectNameSingular: 'absence',
      limit: ABSENCES_RECORDS_LIMIT,
      recordGqlFields: {
        id: true,
        memberId: true,
        absenceType: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

  const { records: memberRecords, loading: isMembersLoading } =
    useFindManyRecords<MemberRecord>({
      objectNameSingular: 'workspaceMember',
      limit: ABSENCES_RECORDS_LIMIT,
      recordGqlFields: { id: true, name: true, departmentId: true },
    });

  // Отделы — объект соседнего модуля org-structure; без него график группируется
  // одной группой «Без отдела».
  const { records: departmentRecords, loading: isDepartmentsLoading } =
    useFindManyRecords<DepartmentRecord>({
      objectNameSingular: 'department',
      limit: ABSENCES_RECORDS_LIMIT,
      recordGqlFields: { id: true, name: true },
    });

  const absences = useMemo<AbsenceItem[]>(
    () =>
      absenceRecords.flatMap((record) =>
        record.memberId && record.startDate && record.endDate
          ? [
              {
                id: record.id,
                memberId: record.memberId,
                absenceType: record.absenceType ?? 'VACATION',
                status: record.status ?? 'REQUESTED',
                startDate: record.startDate,
                endDate: record.endDate,
              },
            ]
          : [],
      ),
    [absenceRecords],
  );

  const members = useMemo<AbsenceMember[]>(
    () =>
      memberRecords.map((record) => ({
        id: record.id,
        fullName: [record.name?.firstName, record.name?.lastName]
          .filter((part) => part !== null && part !== undefined && part !== '')
          .join(' '),
        departmentId: record.departmentId ?? null,
      })),
    [memberRecords],
  );

  const departments = useMemo<AbsenceDepartment[]>(
    () =>
      departmentRecords.map((record) => ({
        id: record.id,
        name: record.name ?? '',
      })),
    [departmentRecords],
  );

  return {
    absences,
    members,
    departments,
    isLoading: isAbsencesLoading || isMembersLoading || isDepartmentsLoading,
  };
};
