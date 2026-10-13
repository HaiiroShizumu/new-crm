import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import {
  DEPARTMENT_OBJECT_NAME,
  WORKSPACE_MEMBER_OBJECT_NAME,
} from 'src/modules/smb-org-structure/constants/org-structure.constants';
import { OrgStructureResolver } from 'src/modules/smb-org-structure/services/org-structure-resolver';
import {
  type OrgStructureDepartment,
  type OrgStructureMember,
  type OrgStructureReader,
} from 'src/modules/smb-org-structure/types/org-structure-reader.type';

type DepartmentRecord = {
  id: string;
  parentDepartmentId?: string | null;
  headId?: string | null;
};

type MemberRecord = {
  id: string;
  managerId?: string | null;
  departmentId?: string | null;
};

// Серверная точка «кто руководитель» для процессов и отсутствий (G-3).
// Вызывающий передаёт контекст компании; чтение — внутри него, поэтому записи
// другой компании недостижимы.
@Injectable()
export class SmbOrgStructureService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async findMemberManagerId(
    authContext: WorkspaceAuthContext,
    memberId: string,
  ): Promise<string | null> {
    return this.runWithResolver(authContext, (resolver) =>
      resolver.findMemberManagerId(memberId),
    );
  }

  async findMemberManagerChain(
    authContext: WorkspaceAuthContext,
    memberId: string,
  ): Promise<string[]> {
    return this.runWithResolver(authContext, (resolver) =>
      resolver.findMemberManagerChain(memberId),
    );
  }

  async findDepartmentHeadId(
    authContext: WorkspaceAuthContext,
    departmentId: string,
  ): Promise<string | null> {
    return this.runWithResolver(authContext, (resolver) =>
      resolver.findDepartmentHeadId(departmentId),
    );
  }

  async wouldCreateDepartmentCycle(
    authContext: WorkspaceAuthContext,
    props: { departmentId: string; newParentDepartmentId: string | null },
  ): Promise<boolean> {
    return this.runWithResolver(authContext, (resolver) =>
      resolver.wouldCreateDepartmentCycle(props),
    );
  }

  private async runWithResolver<TResult>(
    authContext: WorkspaceAuthContext,
    run: (resolver: OrgStructureResolver) => Promise<TResult>,
  ): Promise<TResult> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const departmentRepository =
        this.workspaceOrmManager.getRepository<DepartmentRecord>(
          DEPARTMENT_OBJECT_NAME,
          { shouldBypassPermissionChecks: true },
        );
      const memberRepository =
        this.workspaceOrmManager.getRepository<MemberRecord>(
          WORKSPACE_MEMBER_OBJECT_NAME,
          { shouldBypassPermissionChecks: true },
        );

      const reader: OrgStructureReader = {
        getMember: async (memberId) => {
          const record = await memberRepository.findOne({
            where: { id: memberId },
          });

          return isDefined(record) ? toMember(record) : null;
        },
        getDepartment: async (departmentId) => {
          const record = await departmentRepository.findOne({
            where: { id: departmentId },
          });

          return isDefined(record) ? toDepartment(record) : null;
        },
      };

      return run(new OrgStructureResolver(reader));
    }, authContext);
  }
}

const toMember = (record: MemberRecord): OrgStructureMember => ({
  id: record.id,
  managerId: record.managerId ?? null,
  departmentId: record.departmentId ?? null,
});

const toDepartment = (record: DepartmentRecord): OrgStructureDepartment => ({
  id: record.id,
  parentDepartmentId: record.parentDepartmentId ?? null,
  headId: record.headId ?? null,
});
