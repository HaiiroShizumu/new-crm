export type AbsenceType =
  | 'VACATION'
  | 'SICK_LEAVE'
  | 'BUSINESS_TRIP'
  | 'TIME_OFF';

export type AbsenceStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type AbsenceItem = {
  id: string;
  memberId: string;
  absenceType: AbsenceType;
  status: AbsenceStatus;
  // Календарные даты `YYYY-MM-DD`.
  startDate: string;
  endDate: string;
};

export type AbsenceMember = {
  id: string;
  fullName: string;
  departmentId: string | null;
};

export type AbsenceDepartment = { id: string; name: string };

export type AbsenceTimelineRow = {
  member: AbsenceMember;
  // По одному элементу на день месяца: тип отсутствия или null.
  days: (AbsenceType | null)[];
};

export type AbsenceTimelineGroup = {
  departmentId: string | null;
  departmentName: string;
  rows: AbsenceTimelineRow[];
  // Дни месяца (1-based), в которые отсутствуют двое и больше из отдела.
  overlapDays: number[];
};
