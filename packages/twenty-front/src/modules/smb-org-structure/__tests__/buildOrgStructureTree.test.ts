import { buildOrgStructureTree } from '@/smb-org-structure/utils/buildOrgStructureTree';
import { getDepartmentSubtreeMemberCount } from '@/smb-org-structure/utils/getDepartmentSubtreeMemberCount';

const department = (
  id: string,
  name: string,
  parentDepartmentId: string | null = null,
) => ({ id, name, parentDepartmentId, headId: null });

const member = (
  id: string,
  fullName: string,
  departmentId: string | null = null,
) => ({ id, fullName, jobTitle: null, departmentId, managerId: null });

describe('buildOrgStructureTree', () => {
  it('собирает дерево, раскладывает сотрудников и сортирует по имени', () => {
    const tree = buildOrgStructureTree({
      departments: [
        department('sales', 'Продажи', 'root'),
        department('root', 'Компания'),
        department('hr', 'Кадры', 'root'),
      ],
      members: [
        member('m2', 'Яна', 'sales'),
        member('m1', 'Антон', 'sales'),
        member('m3', 'Вера', null),
      ],
    });

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].children.map((node) => node.department.id)).toEqual([
      'hr',
      'sales',
    ]);
    expect(
      tree.roots[0].children[1].members.map((item) => item.fullName),
    ).toEqual(['Антон', 'Яна']);
    expect(tree.unassignedMembers.map((item) => item.id)).toEqual(['m3']);
  });

  it('участник с неизвестным отделом попадает в «без отдела»', () => {
    const tree = buildOrgStructureTree({
      departments: [department('root', 'Компания')],
      members: [member('m1', 'Антон', 'deleted-department')],
    });

    expect(tree.unassignedMembers.map((item) => item.id)).toEqual(['m1']);
  });

  it('цикл в данных не ломает построение: отделы цикла — корни', () => {
    const tree = buildOrgStructureTree({
      departments: [department('a', 'А', 'b'), department('b', 'Б', 'a')],
      members: [],
    });

    expect(tree.roots.map((node) => node.department.id).sort()).toEqual([
      'a',
      'b',
    ]);
  });

  it('счётчик подтягивает сотрудников дочерних отделов', () => {
    const tree = buildOrgStructureTree({
      departments: [
        department('root', 'Компания'),
        department('c', 'Ц', 'root'),
      ],
      members: [member('m1', 'А', 'root'), member('m2', 'Б', 'c')],
    });

    expect(getDepartmentSubtreeMemberCount(tree.roots[0])).toBe(2);
  });
});
