type SmbEmbeddedCookieAttributes = {
  sameSite?: 'none';
  secure?: boolean;
  partitioned?: boolean;
};

// Inside a frame of another site the browser refuses to store SameSite=Lax
// cookies, and the session tokens live in cookies. SameSite=None is the only
// value that survives there; Partitioned keeps the cookie bound to the
// embedding portal, which is what Safari and Firefox require.
export const getSmbEmbeddedCookieAttributes = (
  isEmbedded: boolean,
): SmbEmbeddedCookieAttributes =>
  isEmbedded ? { sameSite: 'none', secure: true, partitioned: true } : {};
