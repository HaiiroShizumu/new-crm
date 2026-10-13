import { isNonEmptyString } from '@sniptt/guards';

type SmbBitrixRestEndpoint = {
  restEndpoint: string;
  portalDomain: string;
};

// The endpoint comes from oauth.bitrix.info, but it is still an address this
// server is about to call, so it is narrowed to plain https://host/rest/.
export const parseSmbBitrixRestEndpoint = (
  value: unknown,
): SmbBitrixRestEndpoint | undefined => {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  const hasCredentials = url.username !== '' || url.password !== '';
  const hasExtraParts = url.search !== '' || url.hash !== '' || url.port !== '';

  if (
    url.protocol !== 'https:' ||
    hasCredentials ||
    hasExtraParts ||
    url.pathname.replace(/\/+$/, '') !== '/rest'
  ) {
    return undefined;
  }

  return {
    restEndpoint: `https://${url.hostname}/rest/`,
    portalDomain: url.hostname,
  };
};
