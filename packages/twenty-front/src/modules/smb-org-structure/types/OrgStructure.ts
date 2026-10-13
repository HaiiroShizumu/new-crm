export type OrgStructureDepartment = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  headId: string | null;
};

export type OrgStructureMember = {
  id: string;
  fullName: string;
  jobTitle: string | null;
  departmentId: string | null;
  managerId: string | null;
};

export type OrgStructureTreeNode = {
  department: OrgStructureDepartment;
  members: OrgStructureMember[];
  children: OrgStructureTreeNode[];
};

export type OrgStructureTree = {
  roots: OrgStructureTreeNode[];
  // Участники без отдела (или с отделом, которого нет в списке).
  unassignedMembers: OrgStructureMember[];
};
