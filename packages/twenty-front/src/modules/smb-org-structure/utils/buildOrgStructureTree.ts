import {
  type OrgStructureDepartment,
  type OrgStructureMember,
  type OrgStructureTree,
  type OrgStructureTreeNode,
} from '@/smb-org-structure/types/OrgStructure';

const compareByName = (
  left: { name: string },
  right: { name: string },
): number => left.name.localeCompare(right.name, 'ru');

const compareByFullName = (
  left: OrgStructureMember,
  right: OrgStructureMember,
): number => left.fullName.localeCompare(right.fullName, 'ru');

// Дерево отделов с сотрудниками. Отдел, чей родитель не найден или входит в
// цикл (такое могло попасть в данные импортом), показывается корнем —
// страница не должна ломаться из-за чужих данных; запрет цикла при правке
// держит серверный хук (G-4).
export const buildOrgStructureTree = ({
  departments,
  members,
}: {
  departments: OrgStructureDepartment[];
  members: OrgStructureMember[];
}): OrgStructureTree => {
  const departmentById = new Map(
    departments.map((department) => [department.id, department]),
  );

  const isInCycle = (department: OrgStructureDepartment): boolean => {
    const visitedIds = new Set<string>([department.id]);
    let parentId = department.parentDepartmentId;

    while (parentId !== null) {
      if (visitedIds.has(parentId)) {
        return true;
      }

      visitedIds.add(parentId);
      parentId = departmentById.get(parentId)?.parentDepartmentId ?? null;
    }

    return false;
  };

  const nodeById = new Map<string, OrgStructureTreeNode>(
    departments.map((department) => [
      department.id,
      { department, members: [], children: [] },
    ]),
  );

  const roots: OrgStructureTreeNode[] = [];

  for (const department of [...departments].sort(compareByName)) {
    const node = nodeById.get(department.id) as OrgStructureTreeNode;
    const parentNode =
      department.parentDepartmentId === null || isInCycle(department)
        ? undefined
        : nodeById.get(department.parentDepartmentId);

    if (parentNode === undefined) {
      roots.push(node);
    } else {
      parentNode.children.push(node);
    }
  }

  const unassignedMembers: OrgStructureMember[] = [];

  for (const member of [...members].sort(compareByFullName)) {
    const node =
      member.departmentId === null
        ? undefined
        : nodeById.get(member.departmentId);

    if (node === undefined) {
      unassignedMembers.push(member);
    } else {
      node.members.push(member);
    }
  }

  return { roots, unassignedMembers };
};
