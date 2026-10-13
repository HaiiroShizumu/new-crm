import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { useMemo, useState, type DragEvent } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { OrgStructureDepartmentNode } from '@/smb-org-structure/components/OrgStructureDepartmentNode';
import { OrgStructureMemberCard } from '@/smb-org-structure/components/OrgStructureMemberCard';
import { useMoveMemberToDepartment } from '@/smb-org-structure/hooks/useMoveMemberToDepartment';
import { useOrgStructureData } from '@/smb-org-structure/hooks/useOrgStructureData';
import { buildOrgStructureTree } from '@/smb-org-structure/utils/buildOrgStructureTree';

const MEMBER_DRAG_DATA_TYPE = 'application/x-smb-member-id';

const StyledPage = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const StyledTree = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledUnassigned = styled.div`
  border-top: 1px dashed ${themeCssVariables.border.color.medium};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledUnassignedMember = styled.button`
  background: transparent;
  border: none;
  cursor: grab;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-align: left;
`;

export const OrgStructurePage = () => {
  const { departments, members, isLoading } = useOrgStructureData();
  const moveMemberToDepartment = useMoveMemberToDepartment();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const tree = useMemo(
    () => buildOrgStructureTree({ departments, members }),
    [departments, members],
  );
  const departmentsById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );
  const membersById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const selectedMember =
    selectedMemberId === null ? undefined : membersById.get(selectedMemberId);

  const handleUnassignedDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();

    const memberId = event.dataTransfer.getData(MEMBER_DRAG_DATA_TYPE);

    if (memberId !== '') {
      void moveMemberToDepartment({ memberId, departmentId: null });
    }
  };

  if (isLoading) {
    return (
      <StyledPage>
        <StyledTree>
          <Trans>Загрузка…</Trans>
        </StyledTree>
      </StyledPage>
    );
  }

  return (
    <StyledPage>
      <StyledTree>
        {tree.roots.map((root) => (
          <OrgStructureDepartmentNode
            key={root.department.id}
            node={root}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            onDropMember={(props) => void moveMemberToDepartment(props)}
          />
        ))}
        <StyledUnassigned
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleUnassignedDrop}
        >
          <strong>
            <Trans>Без отдела</Trans>
          </strong>
          {tree.unassignedMembers.map((member) => (
            <StyledUnassignedMember
              key={member.id}
              type="button"
              draggable
              onClick={() => setSelectedMemberId(member.id)}
              onDragStart={(event) =>
                event.dataTransfer.setData(MEMBER_DRAG_DATA_TYPE, member.id)
              }
            >
              {member.fullName}
            </StyledUnassignedMember>
          ))}
        </StyledUnassigned>
      </StyledTree>
      {selectedMember !== undefined && (
        <OrgStructureMemberCard
          member={selectedMember}
          departmentsById={departmentsById}
          membersById={membersById}
        />
      )}
    </StyledPage>
  );
};
