import { isSmbBitrixAccountSafeToLink } from 'src/modules/smb-bitrix/utils/is-smb-bitrix-account-safe-to-link.util';

const WORKSPACE_ID = 'workspace-1';

const candidate = {
  canImpersonate: false,
  canAccessFullAdminPanel: false,
  workspaceIds: [WORKSPACE_ID],
};

describe('isSmbBitrixAccountSafeToLink', () => {
  it('links an account that only belongs to the portal workspace', () => {
    expect(
      isSmbBitrixAccountSafeToLink({ candidate, workspaceId: WORKSPACE_ID }),
    ).toBe(true);
  });

  it('links an account without any workspace', () => {
    expect(
      isSmbBitrixAccountSafeToLink({
        candidate: { ...candidate, workspaceIds: [] },
        workspaceId: WORKSPACE_ID,
      }),
    ).toBe(true);
  });

  it('refuses an account that is also a member of another workspace', () => {
    expect(
      isSmbBitrixAccountSafeToLink({
        candidate: { ...candidate, workspaceIds: [WORKSPACE_ID, 'other'] },
        workspaceId: WORKSPACE_ID,
      }),
    ).toBe(false);
  });

  it('refuses server administrators', () => {
    expect(
      isSmbBitrixAccountSafeToLink({
        candidate: { ...candidate, canAccessFullAdminPanel: true },
        workspaceId: WORKSPACE_ID,
      }),
    ).toBe(false);
    expect(
      isSmbBitrixAccountSafeToLink({
        candidate: { ...candidate, canImpersonate: true },
        workspaceId: WORKSPACE_ID,
      }),
    ).toBe(false);
  });
});
