import { buildSmbBitrixSubdomain } from 'src/modules/smb-bitrix/utils/build-smb-bitrix-subdomain.util';

describe('buildSmbBitrixSubdomain', () => {
  it('uses the portal name of a cloud portal', () => {
    expect(buildSmbBitrixSubdomain('Acme.bitrix24.ru')).toBe('acme');
    expect(buildSmbBitrixSubdomain('acme.bitrix24.kz')).toBe('acme');
  });

  it('joins the labels of an on-premise domain without the zone', () => {
    expect(buildSmbBitrixSubdomain('portal.example.com')).toBe(
      'portal-example',
    );
  });

  it('drops characters a subdomain cannot contain', () => {
    expect(buildSmbBitrixSubdomain('my_portal.bitrix24.ru')).toBe('myportal');
  });

  it('returns nothing when the name is too short to be a subdomain', () => {
    expect(buildSmbBitrixSubdomain('ab.bitrix24.ru')).toBeUndefined();
  });

  it('keeps the result within the length limit without a trailing dash', () => {
    const subdomain = buildSmbBitrixSubdomain(
      'a-very-long-company-name-that-goes-on.example.com',
    );

    expect(subdomain?.length).toBeLessThanOrEqual(30);
    expect(subdomain?.endsWith('-')).toBe(false);
  });
});
