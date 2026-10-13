import {
  doAbsenceRangesOverlap,
  type AbsenceRange,
} from 'src/modules/smb-absences/utils/absence-dates.util';

export type ExistingAbsence = AbsenceRange & { id: string };

// Первое отсутствие того же участника, пересекающееся с новым диапазоном.
// Список передаётся уже без отклонённых и отменённых.
export const findAbsenceConflict = ({
  range,
  existingAbsences,
  excludeAbsenceId,
}: {
  range: AbsenceRange;
  existingAbsences: ExistingAbsence[];
  excludeAbsenceId?: string;
}): ExistingAbsence | null =>
  existingAbsences.find(
    (absence) =>
      absence.id !== excludeAbsenceId && doAbsenceRangesOverlap(range, absence),
  ) ?? null;
