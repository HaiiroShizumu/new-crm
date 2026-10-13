// Даты отсутствий — календарные `YYYY-MM-DD` (поле DATE): сравниваются как
// строки, без часовых поясов.
export type AbsenceRange = { startDate: string; endDate: string };

export const isValidAbsenceRange = ({
  startDate,
  endDate,
}: AbsenceRange): boolean => startDate <= endDate;

// Диапазоны включают обе границы: отпуск «1–5» и «5–9» пересекаются.
export const doAbsenceRangesOverlap = (
  left: AbsenceRange,
  right: AbsenceRange,
): boolean =>
  left.startDate <= right.endDate && right.startDate <= left.endDate;
