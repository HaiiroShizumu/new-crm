type SmbBitrixLinkCandidate = {
  canImpersonate: boolean;
  canAccessFullAdminPanel: boolean;
  workspaceIds: string[];
};

// A portal administrator controls the emails of the portal's employees, and a
// session in one workspace can hop to the user's other workspaces. So an
// existing account is linked by email only when linking gives the portal
// nothing beyond its own workspace.
export const isSmbBitrixAccountSafeToLink = ({
  candidate,
  workspaceId,
}: {
  candidate: SmbBitrixLinkCandidate;
  workspaceId: string;
}): boolean =>
  !candidate.canImpersonate &&
  !candidate.canAccessFullAdminPanel &&
  candidate.workspaceIds.every(
    (candidateWorkspaceId) => candidateWorkspaceId === workspaceId,
  );
