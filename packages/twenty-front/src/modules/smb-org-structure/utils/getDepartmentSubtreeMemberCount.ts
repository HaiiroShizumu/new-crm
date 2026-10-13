import { type OrgStructureTreeNode } from '@/smb-org-structure/types/OrgStructure';

export const getDepartmentSubtreeMemberCount = (
  node: OrgStructureTreeNode,
): number =>
  node.members.length +
  node.children.reduce(
    (total, child) => total + getDepartmentSubtreeMemberCount(child),
    0,
  );
