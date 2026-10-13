export const getSmbConversationRedisTopic = ({
  workspaceId,
  workspaceMemberId,
}: {
  workspaceId: string;
  workspaceMemberId: string;
}): string => `SMB_CONVERSATION:${workspaceId}:${workspaceMemberId}`;
