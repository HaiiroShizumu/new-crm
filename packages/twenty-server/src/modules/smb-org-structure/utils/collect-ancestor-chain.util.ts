import { ORG_STRUCTURE_MAX_DEPTH } from 'src/modules/smb-org-structure/constants/org-structure.constants';

export type AncestorChain = {
  // Предки от ближайшего к корню; сам стартовый узел не входит.
  ancestorIds: string[];
  // Цепочка замкнулась на себя или вышла за предел глубины.
  hasCycle: boolean;
};

// Поднимается от `startId` по ссылке «родитель»; общий для отделов
// (parentDepartmentId) и участников (managerId).
export const collectAncestorChain = async ({
  startId,
  getParentId,
  maxDepth = ORG_STRUCTURE_MAX_DEPTH,
}: {
  startId: string;
  getParentId: (id: string) => Promise<string | null>;
  maxDepth?: number;
}): Promise<AncestorChain> => {
  const visitedIds = new Set<string>([startId]);
  const ancestorIds: string[] = [];
  let currentId = startId;

  while (ancestorIds.length < maxDepth) {
    const parentId = await getParentId(currentId);

    if (parentId === null) {
      return { ancestorIds, hasCycle: false };
    }

    if (visitedIds.has(parentId)) {
      return { ancestorIds, hasCycle: true };
    }

    visitedIds.add(parentId);
    ancestorIds.push(parentId);
    currentId = parentId;
  }

  return { ancestorIds, hasCycle: true };
};
