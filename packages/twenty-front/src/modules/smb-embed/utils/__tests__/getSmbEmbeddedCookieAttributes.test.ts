import { getSmbEmbeddedCookieAttributes } from '@/smb-embed/utils/getSmbEmbeddedCookieAttributes';

describe('getSmbEmbeddedCookieAttributes', () => {
  it('changes nothing for the application opened in its own tab', () => {
    expect(getSmbEmbeddedCookieAttributes(false)).toEqual({});
  });

  it('makes cookies storable inside a frame of another site', () => {
    expect(getSmbEmbeddedCookieAttributes(true)).toEqual({
      sameSite: 'none',
      secure: true,
      partitioned: true,
    });
  });
});
