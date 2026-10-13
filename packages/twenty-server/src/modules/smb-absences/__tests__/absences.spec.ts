import { CommonQueryRunnerException } from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  AbsenceCreateOneOverlapPreQueryHook,
  AbsenceUpdateOneOverlapPreQueryHook,
} from 'src/modules/smb-absences/hooks/absence-overlap.pre-query.hook';
import { type SmbAbsencesService } from 'src/modules/smb-absences/services/smb-absences.service';
import {
  doAbsenceRangesOverlap,
  isValidAbsenceRange,
} from 'src/modules/smb-absences/utils/absence-dates.util';
import { findAbsenceConflict } from 'src/modules/smb-absences/utils/find-absence-conflict.util';

const authContext = {} as WorkspaceAuthContext;

describe('диапазоны отсутствий (A-3)', () => {
  it('границы включаются', () => {
    expect(
      doAbsenceRangesOverlap(
        { startDate: '2026-10-01', endDate: '2026-10-05' },
        { startDate: '2026-10-05', endDate: '2026-10-09' },
      ),
    ).toBe(true);
  });

  it('соседние дни не пересекаются', () => {
    expect(
      doAbsenceRangesOverlap(
        { startDate: '2026-10-01', endDate: '2026-10-04' },
        { startDate: '2026-10-05', endDate: '2026-10-09' },
      ),
    ).toBe(false);
  });

  it('перевёрнутый диапазон недопустим', () => {
    expect(
      isValidAbsenceRange({ startDate: '2026-10-09', endDate: '2026-10-01' }),
    ).toBe(false);
  });

  it('исключает редактируемую запись из поиска конфликта', () => {
    expect(
      findAbsenceConflict({
        range: { startDate: '2026-10-01', endDate: '2026-10-05' },
        existingAbsences: [
          { id: 'self', startDate: '2026-10-02', endDate: '2026-10-03' },
        ],
        excludeAbsenceId: 'self',
      }),
    ).toBeNull();
  });
});

describe('хуки пересечения отсутствий (A-3)', () => {
  const findConflictForMember = jest.fn();
  const getAbsenceMemberId = jest.fn();
  const service = {
    findConflictForMember,
    getAbsenceMemberId,
  } as unknown as SmbAbsencesService;

  beforeEach(() => {
    findConflictForMember.mockReset();
    getAbsenceMemberId.mockReset();
  });

  it('создание с пересечением отклоняется', async () => {
    findConflictForMember.mockResolvedValue({ id: 'other' });
    const hook = new AbsenceCreateOneOverlapPreQueryHook(service);

    await expect(
      hook.execute(authContext, 'absence', {
        data: {
          memberId: 'm1',
          startDate: '2026-10-01',
          endDate: '2026-10-05',
        },
      }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);
  });

  it('создание без пересечения проходит', async () => {
    findConflictForMember.mockResolvedValue(null);
    const hook = new AbsenceCreateOneOverlapPreQueryHook(service);
    const payload = {
      data: { memberId: 'm1', startDate: '2026-10-01', endDate: '2026-10-05' },
    };

    await expect(hook.execute(authContext, 'absence', payload)).resolves.toBe(
      payload,
    );
  });

  it('перевёрнутый период отклоняется без обращения к данным', async () => {
    const hook = new AbsenceCreateOneOverlapPreQueryHook(service);

    await expect(
      hook.execute(authContext, 'absence', {
        data: {
          memberId: 'm1',
          startDate: '2026-10-09',
          endDate: '2026-10-01',
        },
      }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);
    expect(findConflictForMember).not.toHaveBeenCalled();
  });

  it('обновление дополняет данные текущей записью и исключает её саму', async () => {
    getAbsenceMemberId.mockResolvedValue({
      memberId: 'm1',
      range: { startDate: '2026-10-01', endDate: '2026-10-05' },
    });
    findConflictForMember.mockResolvedValue(null);
    const hook = new AbsenceUpdateOneOverlapPreQueryHook(service);

    await hook.execute(authContext, 'absence', {
      id: 'a1',
      data: { endDate: '2026-10-07' },
    });

    expect(findConflictForMember).toHaveBeenCalledWith(authContext, {
      memberId: 'm1',
      range: { startDate: '2026-10-01', endDate: '2026-10-07' },
      excludeAbsenceId: 'a1',
    });
  });

  it('обновление без дат и сотрудника (статус) не проверяется', async () => {
    const hook = new AbsenceUpdateOneOverlapPreQueryHook(service);
    const payload = { id: 'a1', data: { status: 'APPROVED' } };

    await expect(hook.execute(authContext, 'absence', payload)).resolves.toBe(
      payload,
    );
    expect(getAbsenceMemberId).not.toHaveBeenCalled();
  });
});
