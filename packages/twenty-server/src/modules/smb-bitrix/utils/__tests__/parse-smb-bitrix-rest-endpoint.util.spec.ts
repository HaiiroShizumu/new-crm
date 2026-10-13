import { parseSmbBitrixRestEndpoint } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-rest-endpoint.util';

describe('parseSmbBitrixRestEndpoint', () => {
  it('accepts the endpoint of a cloud portal', () => {
    expect(
      parseSmbBitrixRestEndpoint('https://acme.bitrix24.ru/rest/'),
    ).toEqual({
      restEndpoint: 'https://acme.bitrix24.ru/rest/',
      portalDomain: 'acme.bitrix24.ru',
    });
  });

  it('accepts an on-premise portal on its own domain', () => {
    expect(
      parseSmbBitrixRestEndpoint('https://portal.example.com/rest')
        ?.portalDomain,
    ).toBe('portal.example.com');
  });

  it.each([
    'http://acme.bitrix24.ru/rest/',
    'https://user:pass@acme.bitrix24.ru/rest/',
    'https://acme.bitrix24.ru:8443/rest/',
    'https://acme.bitrix24.ru/rest/?auth=1',
    'https://acme.bitrix24.ru/other/',
    'not a url',
    '',
  ])('rejects %s', (value: string) => {
    expect(parseSmbBitrixRestEndpoint(value)).toBeUndefined();
  });

  it('rejects a value that is not a string', () => {
    expect(parseSmbBitrixRestEndpoint(undefined)).toBeUndefined();
  });
});
