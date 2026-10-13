import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CommonQueryRunnerException } from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import {
  DepartmentUpdateManyCyclePreQueryHook,
  DepartmentUpdateOneCyclePreQueryHook,
} from 'src/modules/smb-org-structure/hooks/department-cycle.pre-query.hook';
import { type SmbOrgStructureService } from 'src/modules/smb-org-structure/services/smb-org-structure.service';

const authContext = {} as WorkspaceAuthContext;

describe('DepartmentUpdateOneCyclePreQueryHook (G-4)', () => {
  const wouldCreateDepartmentCycle = jest.fn();
  const hook = new DepartmentUpdateOneCyclePreQueryHook({
    wouldCreateDepartmentCycle,
  } as unknown as SmbOrgStructureService);

  beforeEach(() => wouldCreateDepartmentCycle.mockReset());

  it('отклоняет назначение родителя, создающее цикл', async () => {
    wouldCreateDepartmentCycle.mockResolvedValue(true);

    await expect(
      hook.execute(authContext, 'department', {
        id: 'd1',
        data: { parentDepartmentId: 'd2' },
      }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);
    expect(wouldCreateDepartmentCycle).toHaveBeenCalledWith(authContext, {
      departmentId: 'd1',
      newParentDepartmentId: 'd2',
    });
  });

  it('пропускает смену родителя без цикла', async () => {
    wouldCreateDepartmentCycle.mockResolvedValue(false);
    const payload = { id: 'd1', data: { parentDepartmentId: 'd3' } };

    await expect(
      hook.execute(authContext, 'department', payload),
    ).resolves.toBe(payload);
  });

  it('не обращается к данным, если родитель не меняется', async () => {
    const payload = { id: 'd1', data: { name: 'Продажи' } };

    await expect(
      hook.execute(authContext, 'department', payload),
    ).resolves.toBe(payload);
    expect(wouldCreateDepartmentCycle).not.toHaveBeenCalled();
  });

  it('снятие родителя (null) проверяется как обычная смена', async () => {
    wouldCreateDepartmentCycle.mockResolvedValue(false);

    await hook.execute(authContext, 'department', {
      id: 'd1',
      data: { parentDepartmentId: null },
    });

    expect(wouldCreateDepartmentCycle).toHaveBeenCalledWith(authContext, {
      departmentId: 'd1',
      newParentDepartmentId: null,
    });
  });
});

describe('DepartmentUpdateManyCyclePreQueryHook', () => {
  const hook = new DepartmentUpdateManyCyclePreQueryHook();

  it('отклоняет массовую смену родителя', async () => {
    await expect(
      hook.execute(authContext, 'department', {
        filter: {},
        data: { parentDepartmentId: 'd2' },
      }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);
  });

  it('пропускает массовую правку других полей', async () => {
    const payload = { filter: {}, data: { name: 'x' } };

    await expect(
      hook.execute(authContext, 'department', payload),
    ).resolves.toBe(payload);
  });
});
