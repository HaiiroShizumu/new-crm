import { isNonEmptyString } from '@sniptt/guards';

type NamedWorkspaceMember = {
  name: { firstName?: string | null; lastName?: string | null };
};

export const getSmbWorkspaceMemberName = (
  workspaceMember: NamedWorkspaceMember | undefined,
): string =>
  [workspaceMember?.name.firstName, workspaceMember?.name.lastName]
    .filter(isNonEmptyString)
    .join(' ');
