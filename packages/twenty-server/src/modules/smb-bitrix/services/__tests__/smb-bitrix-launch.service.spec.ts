import { SmbBitrixLaunchService } from 'src/modules/smb-bitrix/services/smb-bitrix-launch.service';
import { SmbBitrixExceptionCode } from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { type SmbBitrixGrant } from 'src/modules/smb-bitrix/types/smb-bitrix-grant.type';
import { type SmbBitrixLaunchBody } from 'src/modules/smb-bitrix/types/smb-bitrix-launch-body.type';

const GRANT: SmbBitrixGrant = {
  memberId: 'member-1',
  restEndpoint: 'https://acme.bitrix24.ru/rest/',
  portalDomain: 'acme.bitrix24.ru',
  accessToken: 'access',
  refreshToken: 'next-refresh',
  expiresAt: new Date('2026-10-13T10:00:00Z'),
  bitrixUserId: '17',
};

const BODY: SmbBitrixLaunchBody = {
  memberId: 'forged-member',
  refreshToken: 'refresh',
  applicationToken: undefined,
  eventName: undefined,
  isExpanded: false,
};

const ACTIVE_PORTAL = {
  id: 'portal-1',
  memberId: 'member-1',
  domain: 'acme.bitrix24.ru',
  status: 'ACTIVE',
  workspaceId: 'workspace-1',
};

const WORKSPACE = { id: 'workspace-1' };
const USER = { id: 'user-1', email: 'anna@example.com' };
const PERSON = {
  bitrixUserId: '17',
  email: 'anna@example.com',
  firstName: 'Anna',
  lastName: 'Petrova',
};

const buildService = ({
  portal = ACTIVE_PORTAL,
  shouldAutoProvisionWorkspace = false,
}: {
  portal?: Record<string, unknown>;
  shouldAutoProvisionWorkspace?: boolean;
} = {}) => {
  const oauthService = {
    exchangeRefreshToken: jest.fn().mockResolvedValue(GRANT),
  };
  const restService = {
    isCurrentPersonAdmin: jest.fn().mockResolvedValue(true),
    getCurrentPerson: jest.fn().mockResolvedValue(PERSON),
    listActiveEmployees: jest.fn().mockResolvedValue([PERSON]),
  };
  const portalService = {
    upsertFromGrant: jest.fn().mockResolvedValue(portal),
    findByMemberId: jest.fn().mockResolvedValue(portal),
    bindToWorkspace: jest.fn().mockResolvedValue(ACTIVE_PORTAL),
    markReinstalled: jest.fn(),
    markUninstalled: jest.fn(),
    markUsersSynced: jest.fn(),
    saveError: jest.fn(),
    saveApplicationTokenIfAbsent: jest.fn(),
    isApplicationTokenValid: jest.fn().mockReturnValue(false),
  };
  const userService = {
    findBoundUser: jest.fn().mockResolvedValue(null),
    resolveUser: jest
      .fn()
      .mockResolvedValue({ status: 'RESOLVED', user: USER }),
    resolveOwnerAccount: jest.fn().mockResolvedValue(USER),
  };
  const tenantService = {
    findWorkspace: jest.fn().mockResolvedValue(WORKSPACE),
    createWorkspaceForPortal: jest.fn().mockResolvedValue(WORKSPACE),
    allowPortalToEmbed: jest.fn(),
  };
  const loginTokenService = {
    generateLoginToken: jest.fn().mockResolvedValue({ token: 'login-token' }),
  };
  const workspaceDomainsService = {
    buildWorkspaceURL: jest.fn(
      ({
        pathname,
        searchParams,
      }: {
        pathname: string;
        searchParams: Record<string, string>;
      }) => {
        const url = new URL(pathname, 'https://acme.crm.example.ru');

        Object.entries(searchParams).forEach(([key, value]) =>
          url.searchParams.set(key, value),
        );

        return url;
      },
    ),
  };
  const smbConfigService = {
    bitrix: {
      clientId: 'id',
      clientSecret: 'secret',
      shouldAutoProvisionWorkspace,
    },
  };

  const service = new SmbBitrixLaunchService(
    oauthService as never,
    restService as never,
    portalService as never,
    userService as never,
    tenantService as never,
    loginTokenService as never,
    workspaceDomainsService as never,
    smbConfigService as never,
  );

  return {
    service,
    oauthService,
    restService,
    portalService,
    userService,
    tenantService,
    loginTokenService,
  };
};

const flushBackgroundSync = async () => {
  for (let turn = 0; turn < 20; turn++) {
    await Promise.resolve();
  }
};

describe('SmbBitrixLaunchService', () => {
  describe('open', () => {
    it('signs the employee in to the workspace of the portal and lands on the docflow page', async () => {
      const { service, loginTokenService } = buildService();

      const url = new URL(await service.open(BODY));

      expect(url.origin).toBe('https://acme.crm.example.ru');
      expect(url.pathname).toBe('/verify');
      expect(url.searchParams.get('loginToken')).toBe('login-token');
      expect(url.searchParams.get('returnToPath')).toBe('/docflow');
      expect(loginTokenService.generateLoginToken).toHaveBeenCalledWith(
        'anna@example.com',
        'workspace-1',
        'password',
      );
    });

    it('keeps the fullscreen flag across the sign-in redirect', async () => {
      const { service } = buildService();

      const url = new URL(await service.open({ ...BODY, isExpanded: true }));

      expect(url.searchParams.get('returnToPath')).toBe(
        '/docflow?smbExpanded=1',
      );
    });

    it('takes the portal from the grant and never from the request body', async () => {
      const { service, portalService } = buildService();

      await service.open(BODY);

      expect(portalService.upsertFromGrant).toHaveBeenCalledWith(GRANT);
      expect(portalService.findByMemberId).not.toHaveBeenCalled();
    });

    it('refuses a request without a refresh token before calling Bitrix24', async () => {
      const { service, oauthService } = buildService();

      await expect(
        service.open({ ...BODY, refreshToken: undefined }),
      ).rejects.toMatchObject({ code: SmbBitrixExceptionCode.INVALID_REQUEST });
      expect(oauthService.exchangeRefreshToken).not.toHaveBeenCalled();
    });

    it('does not sign anyone in while the portal has no workspace', async () => {
      const { service, loginTokenService } = buildService({
        portal: { ...ACTIVE_PORTAL, status: 'PENDING', workspaceId: null },
      });

      await expect(service.open(BODY)).rejects.toMatchObject({
        code: SmbBitrixExceptionCode.PORTAL_NOT_ACTIVE,
      });
      expect(loginTokenService.generateLoginToken).not.toHaveBeenCalled();
    });

    it('skips the profile request for an employee who already has an account', async () => {
      const { service, restService, userService } = buildService();

      userService.findBoundUser.mockResolvedValue(USER);

      await service.open(BODY);

      expect(restService.getCurrentPerson).not.toHaveBeenCalled();
    });

    it('does not sign in an employee whose email belongs to an account elsewhere', async () => {
      const { service, userService, loginTokenService } = buildService();

      userService.resolveUser.mockResolvedValue({
        status: 'ACCOUNT_LINK_REQUIRED',
        email: 'anna@example.com',
      });

      await expect(service.open(BODY)).rejects.toMatchObject({
        code: SmbBitrixExceptionCode.ACCOUNT_LINK_REQUIRED,
      });
      expect(loginTokenService.generateLoginToken).not.toHaveBeenCalled();
    });
  });

  describe('install', () => {
    it('refuses an employee who is not a portal administrator', async () => {
      const { service, restService, portalService } = buildService();

      restService.isCurrentPersonAdmin.mockResolvedValue(false);

      await expect(service.install(BODY)).rejects.toMatchObject({
        code: SmbBitrixExceptionCode.ADMIN_REQUIRED,
      });
      expect(portalService.upsertFromGrant).not.toHaveBeenCalled();
    });

    it('lets the portal embed the workspace and creates accounts for its employees', async () => {
      const { service, tenantService, userService, portalService } =
        buildService();

      await expect(service.install(BODY)).resolves.toEqual({ isActive: true });
      // The employee sync is deliberately not awaited by install.
      await flushBackgroundSync();

      expect(tenantService.allowPortalToEmbed).toHaveBeenCalledWith(
        'workspace-1',
        'acme.bitrix24.ru',
      );
      expect(userService.resolveUser).toHaveBeenCalledWith(
        expect.objectContaining({ person: PERSON }),
      );
      expect(portalService.markUsersSynced).toHaveBeenCalledWith('portal-1');
    });

    it('leaves the portal pending when workspaces are not created automatically', async () => {
      const { service, tenantService } = buildService({
        portal: { ...ACTIVE_PORTAL, status: 'PENDING', workspaceId: null },
      });

      await expect(service.install(BODY)).resolves.toEqual({ isActive: false });
      expect(tenantService.createWorkspaceForPortal).not.toHaveBeenCalled();
    });

    it('creates a workspace for a new portal when automatic creation is on', async () => {
      const { service, tenantService, portalService } = buildService({
        portal: { ...ACTIVE_PORTAL, status: 'PENDING', workspaceId: null },
        shouldAutoProvisionWorkspace: true,
      });

      await expect(service.install(BODY)).resolves.toEqual({ isActive: true });
      expect(tenantService.createWorkspaceForPortal).toHaveBeenCalled();
      expect(portalService.bindToWorkspace).toHaveBeenCalledWith(
        'portal-1',
        'workspace-1',
      );
    });

    it('keeps the portal pending and records the reason when the workspace cannot be created', async () => {
      const { service, tenantService, portalService } = buildService({
        portal: { ...ACTIVE_PORTAL, status: 'PENDING', workspaceId: null },
        shouldAutoProvisionWorkspace: true,
      });

      tenantService.createWorkspaceForPortal.mockRejectedValue(
        new Error('Workspace limit reached'),
      );

      await expect(service.install(BODY)).resolves.toEqual({ isActive: false });
      expect(portalService.saveError).toHaveBeenCalledWith(
        'portal-1',
        expect.any(Error),
      );
    });
  });

  describe('handleEvent', () => {
    it('ignores an uninstall event whose application token does not match', async () => {
      const { service, portalService } = buildService();

      await expect(
        service.handleEvent({
          ...BODY,
          eventName: 'ONAPPUNINSTALL',
          memberId: 'member-1',
          applicationToken: 'wrong',
        }),
      ).rejects.toMatchObject({
        code: SmbBitrixExceptionCode.PORTAL_PROOF_FAILED,
      });
      expect(portalService.markUninstalled).not.toHaveBeenCalled();
    });

    it('marks the portal uninstalled when the application token matches', async () => {
      const { service, portalService } = buildService();

      portalService.isApplicationTokenValid.mockReturnValue(true);

      await service.handleEvent({
        ...BODY,
        eventName: 'ONAPPUNINSTALL',
        memberId: 'member-1',
        applicationToken: 'app-token',
      });

      expect(portalService.markUninstalled).toHaveBeenCalledWith('portal-1');
    });

    it('stores the application token of a proven install event', async () => {
      const { service, portalService } = buildService();

      await service.handleEvent({
        ...BODY,
        eventName: 'ONAPPINSTALL',
        applicationToken: 'app-token',
      });

      expect(portalService.saveApplicationTokenIfAbsent).toHaveBeenCalledWith(
        ACTIVE_PORTAL,
        'app-token',
      );
    });
  });
});
