import { useMemo } from 'react';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  type OrgStructureDepartment,
  type OrgStructureMember,
} from '@/smb-org-structure/types/OrgStructure';

type DepartmentRecord = {
  id: string;
  name?: string | null;
  parentDepartmentId?: string | null;
  headId?: string | null;
};

type MemberRecord = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
};

const ORG_STRUCTURE_RECORDS_LIMIT = 500;

export const useOrgStructureData = () => {
  const { records: departmentRecords, loading: isDepartmentsLoading } =
    useFindManyRecords<DepartmentRecord & { __typename?: string }>({
      objectNameSingular: 'department',
      limit: ORG_STRUCTURE_RECORDS_LIMIT,
      recordGqlFields: {
        id: true,
        name: true,
        parentDepartmentId: true,
        headId: true,
      },
    });

  const { records: memberRecords, loading: isMembersLoading } =
    useFindManyRecords<MemberRecord & { __typename?: string }>({
      objectNameSingular: 'workspaceMember',
      limit: ORG_STRUCTURE_RECORDS_LIMIT,
      recordGqlFields: {
        id: true,
        name: true,
        jobTitle: true,
        departmentId: true,
        managerId: true,
      },
    });

  const departments = useMemo<OrgStructureDepartment[]>(
    () =>
      departmentRecords.map((record) => ({
        id: record.id,
        name: record.name ?? '',
        parentDepartmentId: record.parentDepartmentId ?? null,
        headId: record.headId ?? null,
      })),
    [departmentRecords],
  );

  const members = useMemo<OrgStructureMember[]>(
    () =>
      memberRecords.map((record) => ({
        id: record.id,
        fullName: [record.name?.firstName, record.name?.lastName]
          .filter((part) => part !== null && part !== undefined && part !== '')
          .join(' '),
        jobTitle: record.jobTitle ?? null,
        departmentId: record.departmentId ?? null,
        managerId: record.managerId ?? null,
      })),
    [memberRecords],
  );

  return {
    departments,
    members,
    isLoading: isDepartmentsLoading || isMembersLoading,
  };
};
