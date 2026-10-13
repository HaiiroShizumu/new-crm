import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

import {
  type OrgStructureDepartment,
  type OrgStructureMember,
} from '@/smb-org-structure/types/OrgStructure';

const StyledCard = styled.aside`
  border-left: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 240px;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledName = styled.div`
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledLabel = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OrgStructureMemberCardProps = {
  member: OrgStructureMember;
  departmentsById: ReadonlyMap<string, OrgStructureDepartment>;
  membersById: ReadonlyMap<string, OrgStructureMember>;
};

export const OrgStructureMemberCard = ({
  member,
  departmentsById,
  membersById,
}: OrgStructureMemberCardProps) => {
  const department =
    member.departmentId === null
      ? undefined
      : departmentsById.get(member.departmentId);
  const manager =
    member.managerId === null ? undefined : membersById.get(member.managerId);

  return (
    <StyledCard>
      <StyledName>{member.fullName}</StyledName>
      <StyledLabel>
        <Trans>Должность</Trans>
      </StyledLabel>
      <div>{member.jobTitle ?? '—'}</div>
      <StyledLabel>
        <Trans>Отдел</Trans>
      </StyledLabel>
      <div>{department?.name ?? '—'}</div>
      <StyledLabel>
        <Trans>Руководитель</Trans>
      </StyledLabel>
      <div>{manager?.fullName ?? '—'}</div>
    </StyledCard>
  );
};
