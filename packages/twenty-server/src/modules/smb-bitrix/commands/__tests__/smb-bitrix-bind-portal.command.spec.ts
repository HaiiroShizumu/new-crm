import { SmbBitrixBindPortalCommand } from 'src/modules/smb-bitrix/commands/smb-bitrix-bind-portal.command';

const PORTAL = {
  id: 'portal-1',
  memberId: 'member-1',
  domain: 'acme.bitrix24.ru',
  status: 'PENDING',
};
const WORKSPACE = { id: 'workspace-1' };
const OPTIONS = { memberId: 'member-1', workspaceId: 'workspace-1' };

const buildCommand = ({
  portal = PORTAL,
  workspace = WORKSPACE,
}: {
  portal?: typeof PORTAL | null;
  workspace?: typeof WORKSPACE | null;
} = {}) => {
  const portalService = {
    findByMemberId: jest.fn().mockResolvedValue(portal),
    bindToWorkspace: jest
      .fn()
      .mockResolvedValue({ ...PORTAL, status: 'ACTIVE' }),
  };
  const tenantService = {
    findWorkspace: jest.fn().mockResolvedValue(workspace),
    allowPortalToEmbed: jest.fn(),
  };
  const command = new SmbBitrixBindPortalCommand(
    portalService as never,
    tenantService as never,
  );

  jest.spyOn(command['logger'], 'log').mockImplementation();
  jest.spyOn(command['logger'], 'error').mockImplementation();

  return { command, portalService, tenantService };
};

describe('SmbBitrixBindPortalCommand', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  it('binds the portal and lets it embed the workspace', async () => {
    const { command, portalService, tenantService } = buildCommand();

    await command.run([], OPTIONS);

    expect(portalService.bindToWorkspace).toHaveBeenCalledWith(
      'portal-1',
      'workspace-1',
    );
    expect(tenantService.allowPortalToEmbed).toHaveBeenCalledWith(
      'workspace-1',
      'acme.bitrix24.ru',
    );
    expect(process.exitCode).toBeUndefined();
  });

  it('fails without binding when the portal is unknown', async () => {
    const { command, portalService } = buildCommand({ portal: null });

    await command.run([], OPTIONS);

    expect(portalService.bindToWorkspace).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('fails without binding when the workspace is unknown', async () => {
    const { command, portalService } = buildCommand({ workspace: null });

    await command.run([], OPTIONS);

    expect(portalService.bindToWorkspace).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
