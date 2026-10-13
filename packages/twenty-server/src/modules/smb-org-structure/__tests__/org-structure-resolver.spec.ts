import { OrgStructureResolver } from 'src/modules/smb-org-structure/services/org-structure-resolver';
import {
  type OrgStructureDepartment,
  type OrgStructureMember,
  type OrgStructureReader,
} from 'src/modules/smb-org-structure/types/org-structure-reader.type';
import { collectAncestorChain } from 'src/modules/smb-org-structure/utils/collect-ancestor-chain.util';

const buildReader = ({
  members = [],
  departments = [],
}: {
  members?: Partial<OrgStructureMember>[];
  departments?: Partial<OrgStructureDepartment>[];
}): OrgStructureReader => {
  const memberById = new Map(
    members.map((member) => [
      member.id as string,
      { managerId: null, departmentId: null, ...member } as OrgStructureMember,
    ]),
  );
  const departmentById = new Map(
    departments.map((department) => [
      department.id as string,
      {
        parentDepartmentId: null,
        headId: null,
        ...department,
      } as OrgStructureDepartment,
    ]),
  );

  return {
    getMember: async (id) => memberById.get(id) ?? null,
    getDepartment: async (id) => departmentById.get(id) ?? null,
  };
};

describe('collectAncestorChain', () => {
  const parents: Record<string, string | null> = { c: 'b', b: 'a', a: null };

  it('поднимается до корня', async () => {
    await expect(
      collectAncestorChain({
        startId: 'c',
        getParentId: async (id) => parents[id] ?? null,
      }),
    ).resolves.toEqual({ ancestorIds: ['b', 'a'], hasCycle: false });
  });

  it('распознаёт цикл в данных и не зацикливается', async () => {
    const cyclic: Record<string, string> = { a: 'b', b: 'c', c: 'a' };

    await expect(
      collectAncestorChain({
        startId: 'a',
        getParentId: async (id) => cyclic[id] ?? null,
      }),
    ).resolves.toMatchObject({ hasCycle: true });
  });

  it('обрывает по пределу глубины', async () => {
    const result = await collectAncestorChain({
      startId: 'n0',
      maxDepth: 3,
      getParentId: async (id) => `n${Number(id.slice(1)) + 1}`,
    });

    expect(result).toEqual({ ancestorIds: ['n1', 'n2', 'n3'], hasCycle: true });
  });
});

describe('OrgStructureResolver.findMemberManagerId (G-3)', () => {
  it('явный руководитель участника важнее руководителя отдела', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'm1', managerId: 'boss', departmentId: 'd1' }],
        departments: [{ id: 'd1', headId: 'head' }],
      }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBe('boss');
  });

  it('без явного — руководитель отдела', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'm1', departmentId: 'd1' }],
        departments: [{ id: 'd1', headId: 'head' }],
      }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBe('head');
  });

  it('поднимается по дереву, пока у отдела нет руководителя', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'm1', departmentId: 'd3' }],
        departments: [
          { id: 'd3', parentDepartmentId: 'd2' },
          { id: 'd2', parentDepartmentId: 'd1' },
          { id: 'd1', headId: 'top' },
        ],
      }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBe('top');
  });

  it('руководитель своего отдела подчиняется руководителю вышестоящего', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'head', departmentId: 'd2' }],
        departments: [
          { id: 'd2', parentDepartmentId: 'd1', headId: 'head' },
          { id: 'd1', headId: 'top' },
        ],
      }),
    );

    await expect(resolver.findMemberManagerId('head')).resolves.toBe('top');
  });

  it('сам себе не руководитель: manager = он сам игнорируется', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'm1', managerId: 'm1' }],
      }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBeNull();
  });

  it('участник без отдела и руководителя — null; неизвестный — null', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({ members: [{ id: 'm1' }] }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBeNull();
    await expect(resolver.findMemberManagerId('ghost')).resolves.toBeNull();
  });

  it('цикл в дереве отделов в данных не зацикливает поиск', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [{ id: 'm1', departmentId: 'd1' }],
        departments: [
          { id: 'd1', parentDepartmentId: 'd2' },
          { id: 'd2', parentDepartmentId: 'd1' },
        ],
      }),
    );

    await expect(resolver.findMemberManagerId('m1')).resolves.toBeNull();
  });
});

describe('OrgStructureResolver.findMemberManagerChain', () => {
  it('цепочка начальников снизу вверх, цикл в данных обрывает её', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        members: [
          { id: 'a', managerId: 'b' },
          { id: 'b', managerId: 'c' },
          { id: 'c', managerId: 'a' },
        ],
      }),
    );

    await expect(resolver.findMemberManagerChain('a')).resolves.toEqual([
      'b',
      'c',
    ]);
  });
});

describe('OrgStructureResolver.findDepartmentHeadId', () => {
  it('наследует руководителя вышестоящего отдела', async () => {
    const resolver = new OrgStructureResolver(
      buildReader({
        departments: [
          { id: 'child', parentDepartmentId: 'root' },
          { id: 'root', headId: 'ceo' },
        ],
      }),
    );

    await expect(resolver.findDepartmentHeadId('child')).resolves.toBe('ceo');
  });
});

describe('OrgStructureResolver.wouldCreateDepartmentCycle (G-4)', () => {
  const resolver = new OrgStructureResolver(
    buildReader({
      departments: [
        { id: 'root' },
        { id: 'sales', parentDepartmentId: 'root' },
        { id: 'sales-north', parentDepartmentId: 'sales' },
        { id: 'hr', parentDepartmentId: 'root' },
      ],
    }),
  );

  it('сам в себя — цикл', async () => {
    await expect(
      resolver.wouldCreateDepartmentCycle({
        departmentId: 'sales',
        newParentDepartmentId: 'sales',
      }),
    ).resolves.toBe(true);
  });

  it('в своего потомка — цикл', async () => {
    await expect(
      resolver.wouldCreateDepartmentCycle({
        departmentId: 'sales',
        newParentDepartmentId: 'sales-north',
      }),
    ).resolves.toBe(true);
  });

  it('в соседа и в корень — не цикл', async () => {
    await expect(
      resolver.wouldCreateDepartmentCycle({
        departmentId: 'sales',
        newParentDepartmentId: 'hr',
      }),
    ).resolves.toBe(false);
    await expect(
      resolver.wouldCreateDepartmentCycle({
        departmentId: 'sales',
        newParentDepartmentId: null,
      }),
    ).resolves.toBe(false);
  });
});
