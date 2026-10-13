import { parseSmbEnv } from 'src/modules/smb-config/utils/parse-smb-env.util';

const LIVEKIT_ENV = {
  LIVEKIT_URL: 'wss://livekit.example.com',
  LIVEKIT_API_KEY: 'key',
  LIVEKIT_API_SECRET: 'secret',
};

describe('parseSmbEnv', () => {
  it('turns both features off when nothing is set', () => {
    expect(parseSmbEnv({})).toEqual({ liveKit: undefined, vapid: undefined });
  });

  it('treats empty strings from docker compose as unset', () => {
    expect(
      parseSmbEnv({
        LIVEKIT_URL: '',
        LIVEKIT_API_KEY: ' ',
        LIVEKIT_API_SECRET: '',
      }).liveKit,
    ).toBeUndefined();
  });

  it('returns the LiveKit configuration when all three values are set', () => {
    expect(parseSmbEnv(LIVEKIT_ENV).liveKit).toEqual({
      url: 'wss://livekit.example.com',
      apiKey: 'key',
      apiSecret: 'secret',
    });
  });

  it('refuses a half-configured feature and names the missing variable', () => {
    expect(() =>
      parseSmbEnv({ ...LIVEKIT_ENV, LIVEKIT_API_SECRET: undefined }),
    ).toThrow(/LIVEKIT_API_SECRET/);

    expect(() => parseSmbEnv({ VAPID_PUBLIC_KEY: 'public' })).toThrow(
      /VAPID_PRIVATE_KEY, VAPID_SUBJECT/,
    );
  });
});
