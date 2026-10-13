const SUBDOMAIN_MAX_LENGTH = 30;

// "acme.bitrix24.ru" -> "acme", "portal.example.com" -> "portal-example".
// The result is only a suggestion: the caller still validates it and falls
// back to a generated subdomain when it is taken or reserved.
export const buildSmbBitrixSubdomain = (
  portalDomain: string,
): string | undefined => {
  const labels = portalDomain.toLowerCase().split('.').filter(Boolean);
  const isCloudPortal = labels.length === 3 && labels[1] === 'bitrix24';
  const meaningfulLabels = isCloudPortal
    ? labels.slice(0, 1)
    : labels.slice(0, -1);

  const subdomain = meaningfulLabels
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, SUBDOMAIN_MAX_LENGTH)
    .replace(/^-+|-+$/g, '');

  return subdomain.length >= 3 ? subdomain : undefined;
};
