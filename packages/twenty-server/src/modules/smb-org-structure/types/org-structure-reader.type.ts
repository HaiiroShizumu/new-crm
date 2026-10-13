export type OrgStructureMember = {
  id: string;
  managerId: string | null;
  departmentId: string | null;
};

export type OrgStructureDepartment = {
  id: string;
  parentDepartmentId: string | null;
  headId: string | null;
};

// Чтение записей структуры. Реализация — по ORM компании (сервис ниже);
// в тестах подставляется карта в памяти.
export type OrgStructureReader = {
  getMember: (memberId: string) => Promise<OrgStructureMember | null>;
  getDepartment: (
    departmentId: string,
  ) => Promise<OrgStructureDepartment | null>;
};
