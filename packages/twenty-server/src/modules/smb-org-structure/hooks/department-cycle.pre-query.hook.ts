import { msg } from '@lingui/core/macro';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { SmbOrgStructureService } from 'src/modules/smb-org-structure/services/smb-org-structure.service';

const PARENT_FIELD = 'parentDepartmentId';

const isParentChange = (data: Record<string, unknown> | undefined): boolean =>
  data !== undefined && PARENT_FIELD in data;

// G-4: отдел не может стать родителем самого себя или своего потомка.
@WorkspaceQueryHook('department.updateOne')
export class DepartmentUpdateOneCyclePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly orgStructureService: SmbOrgStructureService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs,
  ): Promise<UpdateOneResolverArgs> {
    if (!isParentChange(payload.data)) {
      return payload;
    }

    const newParentDepartmentId =
      (payload.data[PARENT_FIELD] as string | null | undefined) ?? null;

    const hasCycle = await this.orgStructureService.wouldCreateDepartmentCycle(
      authContext,
      { departmentId: payload.id, newParentDepartmentId },
    );

    if (hasCycle) {
      throw new CommonQueryRunnerException(
        'Department parent would create a cycle.',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Отдел нельзя вложить в самого себя или в свой дочерний отдел.`,
        },
      );
    }

    return payload;
  }
}

// Массовая смена родителя не проверяется поштучно (фильтр может выбрать
// десятки отделов) — родителя меняют по одному.
@WorkspaceQueryHook('department.updateMany')
export class DepartmentUpdateManyCyclePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    if (isParentChange(payload.data)) {
      throw new CommonQueryRunnerException(
        'Bulk update of department parent is not allowed.',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Родительский отдел меняется только для одного отдела за раз.`,
        },
      );
    }

    return payload;
  }
}
