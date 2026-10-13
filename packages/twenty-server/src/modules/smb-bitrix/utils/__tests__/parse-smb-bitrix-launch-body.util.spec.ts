import { parseSmbBitrixLaunchBody } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-launch-body.util';

describe('parseSmbBitrixLaunchBody', () => {
  it('reads the flat fields Bitrix24 posts when it opens the application', () => {
    expect(
      parseSmbBitrixLaunchBody({
        DOMAIN: 'acme.bitrix24.ru',
        AUTH_ID: 'access',
        REFRESH_ID: ' refresh ',
        member_id: 'member-1',
      }),
    ).toEqual({
      memberId: 'member-1',
      refreshToken: 'refresh',
      applicationToken: undefined,
      eventName: undefined,
      isExpanded: false,
    });
  });

  it('reads the nested auth object of an event', () => {
    expect(
      parseSmbBitrixLaunchBody({
        event: 'OnAppUninstall',
        auth: {
          member_id: 'member-1',
          application_token: 'app-token',
        },
      }),
    ).toEqual({
      memberId: 'member-1',
      refreshToken: undefined,
      applicationToken: 'app-token',
      eventName: 'ONAPPUNINSTALL',
      isExpanded: false,
    });
  });

  it('returns empty fields for a body that is not an object', () => {
    expect(parseSmbBitrixLaunchBody('member_id=1')).toEqual({
      memberId: undefined,
      refreshToken: undefined,
      applicationToken: undefined,
      eventName: undefined,
      isExpanded: false,
    });
  });

  it('reads the fullscreen flag passed through BX24.openApplication', () => {
    expect(
      parseSmbBitrixLaunchBody({
        PLACEMENT_OPTIONS: JSON.stringify({ smbExpanded: '1' }),
      }).isExpanded,
    ).toBe(true);
  });

  it('treats broken placement options as no flag', () => {
    expect(
      parseSmbBitrixLaunchBody({ PLACEMENT_OPTIONS: '{not json' }).isExpanded,
    ).toBe(false);
    expect(
      parseSmbBitrixLaunchBody({ PLACEMENT_OPTIONS: '"smbExpanded"' })
        .isExpanded,
    ).toBe(false);
  });

  it('ignores values that are not strings', () => {
    expect(
      parseSmbBitrixLaunchBody({ member_id: ['a', 'b'], REFRESH_ID: '' })
        .memberId,
    ).toBeUndefined();
  });
});
