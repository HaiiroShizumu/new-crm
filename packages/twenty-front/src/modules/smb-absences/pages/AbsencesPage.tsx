import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { Fragment, useMemo, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { useAbsencesData } from '@/smb-absences/hooks/useAbsencesData';
import { type AbsenceType } from '@/smb-absences/types/Absence';
import { buildAbsenceTimeline } from '@/smb-absences/utils/buildAbsenceTimeline';

const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  VACATION: 'Отпуск',
  SICK_LEAVE: 'Больничный',
  BUSINESS_TRIP: 'Командировка',
  TIME_OFF: 'Отгул',
};

const ABSENCE_TYPE_COLORS: Record<AbsenceType, string> = {
  VACATION: themeCssVariables.color.blue,
  SICK_LEAVE: themeCssVariables.color.red,
  BUSINESS_TRIP: themeCssVariables.color.orange,
  TIME_OFF: themeCssVariables.color.gray,
};

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  height: 100%;
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledNameCell = styled.td`
  left: 0;
  padding: 2px ${themeCssVariables.spacing[2]};
  position: sticky;
  white-space: nowrap;
`;

const StyledDayCell = styled.td<{ color: string | null }>`
  background: ${({ color }) => color ?? 'transparent'};
  border: 1px solid ${themeCssVariables.border.color.light};
  height: 20px;
  min-width: 20px;
`;

const StyledDayHeader = styled.th<{ isOverlap: boolean }>`
  color: ${({ isOverlap }) => (isOverlap ? themeCssVariables.color.red : 'inherit')};
  font-weight: ${({ isOverlap }) => (isOverlap ? 700 : 400)};
  min-width: 20px;
`;

const StyledGroupRow = styled.td`
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding-top: ${themeCssVariables.spacing[2]};
`;

export const AbsencesPage = () => {
  const { absences, members, departments, isLoading } = useAbsencesData();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [departmentFilterId, setDepartmentFilterId] = useState<string | null>(
    null,
  );
  const [absenceTypeFilter, setAbsenceTypeFilter] =
    useState<AbsenceType | null>(null);

  const groups = useMemo(
    () =>
      buildAbsenceTimeline({
        year,
        monthIndex,
        members,
        departments,
        absences,
        departmentFilterId,
        absenceTypeFilter,
      }),
    [
      year,
      monthIndex,
      members,
      departments,
      absences,
      departmentFilterId,
      absenceTypeFilter,
    ],
  );

  const shiftMonth = (delta: number) => {
    const shifted = new Date(Date.UTC(year, monthIndex + delta, 1));

    setYear(shifted.getUTCFullYear());
    setMonthIndex(shifted.getUTCMonth());
  };

  if (isLoading) {
    return (
      <StyledPage>
        <Trans>Загрузка…</Trans>
      </StyledPage>
    );
  }

  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return (
    <StyledPage>
      <StyledToolbar>
        <button type="button" onClick={() => shiftMonth(-1)}>
          ←
        </button>
        <strong>
          {new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString('ru-RU', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </strong>
        <button type="button" onClick={() => shiftMonth(1)}>
          →
        </button>
        <select
          value={departmentFilterId ?? ''}
          onChange={(event) =>
            setDepartmentFilterId(
              event.target.value === '' ? null : event.target.value,
            )
          }
        >
          <option value="">Все отделы</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <select
          value={absenceTypeFilter ?? ''}
          onChange={(event) =>
            setAbsenceTypeFilter(
              event.target.value === ''
                ? null
                : (event.target.value as AbsenceType),
            )
          }
        >
          <option value="">Все типы</option>
          {(Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((type) => (
            <option key={type} value={type}>
              {ABSENCE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </StyledToolbar>
      <StyledTable>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.departmentId ?? 'none'}>
              <tr>
                <StyledGroupRow colSpan={daysInMonth + 1}>
                  {group.departmentName === ''
                    ? 'Без отдела'
                    : group.departmentName}
                </StyledGroupRow>
              </tr>
              <tr>
                <td />
                {Array.from({ length: daysInMonth }, (_, index) => (
                  <StyledDayHeader
                    key={index}
                    isOverlap={group.overlapDays.includes(index + 1)}
                  >
                    {index + 1}
                  </StyledDayHeader>
                ))}
              </tr>
              {group.rows.map((row) => (
                <tr key={row.member.id}>
                  <StyledNameCell>{row.member.fullName}</StyledNameCell>
                  {row.days.map((absenceType, index) => (
                    <StyledDayCell
                      key={index}
                      color={
                        absenceType === null
                          ? null
                          : ABSENCE_TYPE_COLORS[absenceType]
                      }
                      title={
                        absenceType === null
                          ? undefined
                          : ABSENCE_TYPE_LABELS[absenceType]
                      }
                    />
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </StyledTable>
    </StyledPage>
  );
};
