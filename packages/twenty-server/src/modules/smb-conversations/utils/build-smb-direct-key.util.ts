export const buildSmbDirectKey = (
  firstWorkspaceMemberId: string,
  secondWorkspaceMemberId: string,
): string =>
  firstWorkspaceMemberId < secondWorkspaceMemberId
    ? `${firstWorkspaceMemberId}:${secondWorkspaceMemberId}`
    : `${secondWorkspaceMemberId}:${firstWorkspaceMemberId}`;
