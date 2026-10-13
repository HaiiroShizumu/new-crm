import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import {
  ABSENCE_OBJECT_NAME,
  INACTIVE_ABSENCE_STATUSES,
} from 'src/modules/smb-absences/constants/absences.constants';
import { type AbsenceRange } from 'src/modules/smb-absences/utils/absence-dates.util';
import {
  findAbsenceConflict,
  type ExistingAbsence,
} from 'src/modules/smb-absences/utils/find-absence-conflict.util';

type AbsenceRecord = {
  id: string;
  memberId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
};

const isActiveAbsence = (record: AbsenceRecord): boolean =>
  isDefined(record.startDate) &&
  isDefined(record.endDate) &&
  !(INACTIVE_ABSENCE_STATUSES as readonly string[]).includes(
    record.status ?? '',
  );

// Серверные правила отсутствий (A-3, A-5), общие для PRE-хука и процессов.
@Injectable()
export class SmbAbsencesService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async findConflictForMember(
    authContext: WorkspaceAuthContext,
    props: {
      memberId: string;
      range: AbsenceRange;
      excludeAbsenceId?: string;
    },
  ): Promise<ExistingAbsence | null> {
    const records = await this.loadMemberAbsences(authContext, props.memberId);

    return findAbsenceConflict({
      range: props.range,
      existingAbsences: records.filter(isActiveAbsence).map((record) => ({
        id: record.id,
        startDate: record.startDate as string,
        endDate: record.endDate as string,
      })),
      excludeAbsenceId: props.excludeAbsenceId,
    });
  }

  // A-5: отсутствует ли участник в день `date` (`YYYY-MM-DD`) — по согласованным.
  async isMemberAbsentOn(
    authContext: WorkspaceAuthContext,
    props: { memberId: string; date: string },
  ): Promise<boolean> {
    const records = await this.loadMemberAbsences(authContext, props.memberId);

    return records.some(
      (record) =>
        record.status === 'APPROVED' &&
        isDefined(record.startDate) &&
        isDefined(record.endDate) &&
        record.startDate <= props.date &&
        props.date <= record.endDate,
    );
  }

  async getAbsenceMemberId(
    authContext: WorkspaceAuthContext,
    absenceId: string,
  ): Promise<{ memberId: string | null; range: Partial<AbsenceRange> } | null> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = this.workspaceOrmManager.getRepository<AbsenceRecord>(
        ABSENCE_OBJECT_NAME,
        { shouldBypassPermissionChecks: true },
      );
      const record = await repository.findOne({ where: { id: absenceId } });

      if (!isDefined(record)) {
        return null;
      }

      return {
        memberId: record.memberId ?? null,
        range: {
          startDate: record.startDate ?? undefined,
          endDate: record.endDate ?? undefined,
        },
      };
    }, authContext);
  }

  private async loadMemberAbsences(
    authContext: WorkspaceAuthContext,
    memberId: string,
  ): Promise<AbsenceRecord[]> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = this.workspaceOrmManager.getRepository<AbsenceRecord>(
        ABSENCE_OBJECT_NAME,
        { shouldBypassPermissionChecks: true },
      );

      return repository.find({ where: { memberId } });
    }, authContext);
  }
}
