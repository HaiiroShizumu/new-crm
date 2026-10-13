import { collectAncestorChain } from 'src/modules/smb-org-structure/utils/collect-ancestor-chain.util';
import { type OrgStructureReader } from 'src/modules/smb-org-structure/types/org-structure-reader.type';

// Правила структуры компании (G-3, G-4) поверх абстрактного чтения записей.
// Видимость записей структура не ограничивает (G-5): здесь только «кто над кем».
export class OrgStructureResolver {
  constructor(private readonly reader: OrgStructureReader) {}

  // Руководитель отдела: его `head`, а если не назначен — руководитель
  // ближайшего вышестоящего отдела с назначенным руководителем.
  async findDepartmentHeadId(departmentId: string): Promise<string | null> {
    return this.findHeadFrom({ departmentId, excludeMemberId: null });
  }

  // Руководитель участника: явный `manager`; иначе руководитель его отдела;
  // если участник сам руководитель отдела — руководитель вышестоящего.
  // Сам себе руководителем не бывает.
  async findMemberManagerId(memberId: string): Promise<string | null> {
    const member = await this.reader.getMember(memberId);

    if (member === null) {
      return null;
    }

    if (member.managerId !== null && member.managerId !== memberId) {
      return member.managerId;
    }

    if (member.departmentId === null) {
      return null;
    }

    return this.findHeadFrom({
      departmentId: member.departmentId,
      excludeMemberId: memberId,
    });
  }

  // Все начальники участника снизу вверх (для согласований «до уровня N»).
  // Обрывается на цикле в данных, не зацикливаясь.
  async findMemberManagerChain(memberId: string): Promise<string[]> {
    const chain: string[] = [];
    const seenIds = new Set<string>([memberId]);
    let currentId = memberId;

    for (;;) {
      const managerId = await this.findMemberManagerId(currentId);

      if (managerId === null || seenIds.has(managerId)) {
        return chain;
      }

      seenIds.add(managerId);
      chain.push(managerId);
      currentId = managerId;
    }
  }

  // G-4: сделает ли назначение родителя цикл в дереве отделов.
  async wouldCreateDepartmentCycle({
    departmentId,
    newParentDepartmentId,
  }: {
    departmentId: string;
    newParentDepartmentId: string | null;
  }): Promise<boolean> {
    if (newParentDepartmentId === null) {
      return false;
    }

    if (newParentDepartmentId === departmentId) {
      return true;
    }

    const { ancestorIds, hasCycle } = await collectAncestorChain({
      startId: newParentDepartmentId,
      getParentId: async (id) =>
        (await this.reader.getDepartment(id))?.parentDepartmentId ?? null,
    });

    return hasCycle || ancestorIds.includes(departmentId);
  }

  private async findHeadFrom({
    departmentId,
    excludeMemberId,
  }: {
    departmentId: string;
    excludeMemberId: string | null;
  }): Promise<string | null> {
    const visitedIds = new Set<string>();
    let currentId: string | null = departmentId;

    while (currentId !== null && !visitedIds.has(currentId)) {
      visitedIds.add(currentId);

      const department = await this.reader.getDepartment(currentId);

      if (department === null) {
        return null;
      }

      if (department.headId !== null && department.headId !== excludeMemberId) {
        return department.headId;
      }

      currentId = department.parentDepartmentId;
    }

    return null;
  }
}
