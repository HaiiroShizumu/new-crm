import { msg } from '@lingui/core/macro';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateOneResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { SmbAbsencesService } from 'src/modules/smb-absences/services/smb-absences.service';
import { isValidAbsenceRange } from 'src/modules/smb-absences/utils/absence-dates.util';

const badRequest = (
  message: string,
  userFriendlyMessage: ReturnType<typeof msg>,
) =>
  new CommonQueryRunnerException(
    message,
    CommonQueryRunnerExceptionCode.BAD_REQUEST,
    { userFriendlyMessage },
  );

type AbsenceInput = {
  memberId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

// A-3: период не может быть перевёрнут и не может пересекаться с другим
// действующим отсутствием того же сотрудника.
const assertAbsenceAllowed = async ({
  service,
  authContext,
  input,
  current,
  absenceId,
}: {
  service: SmbAbsencesService;
  authContext: WorkspaceAuthContext;
  input: AbsenceInput;
  current: AbsenceInput | null;
  absenceId?: string;
}): Promise<void> => {
  const memberId = input.memberId ?? current?.memberId ?? null;
  const startDate = input.startDate ?? current?.startDate ?? null;
  const endDate = input.endDate ?? current?.endDate ?? null;

  if (startDate === null || endDate === null) {
    return;
  }

  if (!isValidAbsenceRange({ startDate, endDate })) {
    throw badRequest(
      'Absence end date is before start date.',
      msg`Дата окончания раньше даты начала.`,
    );
  }

  if (memberId === null) {
    return;
  }

  const conflict = await service.findConflictForMember(authContext, {
    memberId,
    range: { startDate, endDate },
    excludeAbsenceId: absenceId,
  });

  if (conflict !== null) {
    throw badRequest(
      `Absence overlaps with ${conflict.id}.`,
      msg`У сотрудника уже есть отсутствие на эти даты.`,
    );
  }
};

@WorkspaceQueryHook('absence.createOne')
export class AbsenceCreateOneOverlapPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly absencesService: SmbAbsencesService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    await assertAbsenceAllowed({
      service: this.absencesService,
      authContext,
      input: payload.data as AbsenceInput,
      current: null,
    });

    return payload;
  }
}

@WorkspaceQueryHook('absence.updateOne')
export class AbsenceUpdateOneOverlapPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly absencesService: SmbAbsencesService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs,
  ): Promise<UpdateOneResolverArgs> {
    const input = payload.data as AbsenceInput;

    if (!('memberId' in input || 'startDate' in input || 'endDate' in input)) {
      return payload;
    }

    const current = await this.absencesService.getAbsenceMemberId(
      authContext,
      payload.id,
    );

    await assertAbsenceAllowed({
      service: this.absencesService,
      authContext,
      input,
      current:
        current === null
          ? null
          : { memberId: current.memberId, ...current.range },
      absenceId: payload.id,
    });

    return payload;
  }
}
