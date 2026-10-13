import { SmbBitrixPortalService } from 'src/modules/smb-bitrix/services/smb-bitrix-portal.service';
import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';

const STORED_TOKEN = 'application-token';

const buildPortal = (
  encryptedApplicationToken: string | null,
): SmbBitrixPortalRow => ({
  id: 'portal-1',
  memberId: 'member-1',
  domain: 'acme.bitrix24.ru',
  restEndpoint: 'https://acme.bitrix24.ru/rest/',
  status: 'ACTIVE',
  workspaceId: 'workspace-1',
  encryptedAccessToken: null,
  encryptedRefreshToken: null,
  accessTokenExpiresAt: null,
  encryptedApplicationToken,
  usersSyncedAt: null,
  lastError: null,
  createdAt: new Date('2026-10-13T10:00:00Z'),
  updatedAt: new Date('2026-10-13T10:00:00Z'),
});

const buildService = ({
  decryptVersionedOrThrow = jest.fn().mockReturnValue(STORED_TOKEN),
}: { decryptVersionedOrThrow?: jest.Mock } = {}) => {
  const service = new SmbBitrixPortalService(
    {} as never,
    { decryptVersionedOrThrow } as never,
  );

  return { service, decryptVersionedOrThrow };
};

describe('SmbBitrixPortalService.isApplicationTokenValid', () => {
  it('accepts the token saved at install', () => {
    const { service } = buildService();

    expect(
      service.isApplicationTokenValid(buildPortal('encrypted'), STORED_TOKEN),
    ).toBe(true);
  });

  it('rejects a different token', () => {
    const { service } = buildService();

    expect(
      service.isApplicationTokenValid(buildPortal('encrypted'), 'forged-token'),
    ).toBe(false);
  });

  it.each([[''], [undefined]])('rejects a missing token (%p)', (provided) => {
    const { service, decryptVersionedOrThrow } = buildService();

    expect(
      service.isApplicationTokenValid(buildPortal('encrypted'), provided),
    ).toBe(false);
    expect(decryptVersionedOrThrow).not.toHaveBeenCalled();
  });

  it.each([[null], ['']])(
    'rejects every token when the portal has none saved (%p)',
    (encryptedApplicationToken) => {
      const { service, decryptVersionedOrThrow } = buildService();

      expect(
        service.isApplicationTokenValid(
          buildPortal(encryptedApplicationToken),
          STORED_TOKEN,
        ),
      ).toBe(false);
      expect(decryptVersionedOrThrow).not.toHaveBeenCalled();
    },
  );

  it('rejects the token when the saved one cannot be decrypted', () => {
    const { service } = buildService({
      decryptVersionedOrThrow: jest.fn().mockImplementation(() => {
        throw new Error('bad key');
      }),
    });

    expect(
      service.isApplicationTokenValid(buildPortal('encrypted'), STORED_TOKEN),
    ).toBe(false);
  });
});
