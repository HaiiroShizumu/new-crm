import { styled } from '@linaria/react';
import { useState, type DragEvent } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import {
  type OrgStructureMember,
  type OrgStructureTreeNode,
} from '@/smb-org-structure/types/OrgStructure';
import { getDepartmentSubtreeMemberCount } from '@/smb-org-structure/utils/getDepartmentSubtreeMemberCount';

const MEMBER_DRAG_DATA_TYPE = 'application/x-smb-member-id';

const StyledNode = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledHeader = styled.div<{ isDropTarget: boolean }>`
  align-items: center;
  background: ${({ isDropTarget }) =>
    isDropTarget
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledChildren = styled.div`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin-left: ${themeCssVariables.spacing[3]};
  padding-left: ${themeCssVariables.spacing[2]};
`;

const StyledMember = styled.button<{ isSelected: boolean }>`
  align-items: baseline;
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: grab;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
  text-align: left;
`;

const StyledJobTitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type OrgStructureDepartmentNodeProps = {
  node: OrgStructureTreeNode;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onDropMember: (props: {
    memberId: string;
    departmentId: string | null;
  }) => void;
};

export const OrgStructureDepartmentNode = ({
  node,
  selectedMemberId,
  onSelectMember,
  onDropMember,
}: OrgStructureDepartmentNodeProps) => {
  const [isDropTarget, setIsDropTarget] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (event.dataTransfer.types.includes(MEMBER_DRAG_DATA_TYPE)) {
      event.preventDefault();
      setIsDropTarget(true);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDropTarget(false);

    const memberId = event.dataTransfer.getData(MEMBER_DRAG_DATA_TYPE);

    if (memberId !== '') {
      onDropMember({ memberId, departmentId: node.department.id });
    }
  };

  const renderMember = (member: OrgStructureMember) => (
    <StyledMember
      key={member.id}
      type="button"
      draggable
      isSelected={member.id === selectedMemberId}
      onClick={() => onSelectMember(member.id)}
      onDragStart={(event) =>
        event.dataTransfer.setData(MEMBER_DRAG_DATA_TYPE, member.id)
      }
    >
      <span>{member.fullName}</span>
      {member.jobTitle !== null && (
        <StyledJobTitle>{member.jobTitle}</StyledJobTitle>
      )}
    </StyledMember>
  );

  return (
    <StyledNode>
      <StyledHeader
        isDropTarget={isDropTarget}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={handleDrop}
      >
        <span>{node.department.name}</span>
        <StyledCount>{getDepartmentSubtreeMemberCount(node)}</StyledCount>
      </StyledHeader>
      <StyledChildren>
        {node.members.map(renderMember)}
        {node.children.map((child) => (
          <OrgStructureDepartmentNode
            key={child.department.id}
            node={child}
            selectedMemberId={selectedMemberId}
            onSelectMember={onSelectMember}
            onDropMember={onDropMember}
          />
        ))}
      </StyledChildren>
    </StyledNode>
  );
};
