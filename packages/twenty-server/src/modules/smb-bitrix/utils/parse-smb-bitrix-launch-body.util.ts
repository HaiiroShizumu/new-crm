import { isNonEmptyString, isObject } from '@sniptt/guards';

import { SMB_BITRIX_EXPANDED_OPTION } from 'src/modules/smb-bitrix/constants/smb-bitrix-expanded-option.constant';
import { type SmbBitrixLaunchBody } from 'src/modules/smb-bitrix/types/smb-bitrix-launch-body.type';

const readString = (
  source: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = source[key];

    if (isNonEmptyString(value) && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

// BX24.openApplication hands its parameters over as a JSON string in
// PLACEMENT_OPTIONS. The only one this application sends is the fullscreen flag.
const readIsExpanded = (root: Record<string, unknown>): boolean => {
  if (!isNonEmptyString(root.PLACEMENT_OPTIONS)) {
    return false;
  }

  try {
    const options: unknown = JSON.parse(root.PLACEMENT_OPTIONS);

    return (
      isObject(options) &&
      (options as Record<string, unknown>)[SMB_BITRIX_EXPANDED_OPTION] === '1'
    );
  } catch {
    return false;
  }
};

// Bitrix24 posts two shapes: flat upper-case fields when it opens the
// application in an iframe, and a nested auth[...] object for events.
export const parseSmbBitrixLaunchBody = (
  body: unknown,
): SmbBitrixLaunchBody => {
  const root = isObject(body) ? (body as Record<string, unknown>) : {};
  const auth = isObject(root.auth)
    ? (root.auth as Record<string, unknown>)
    : {};

  return {
    memberId:
      readString(auth, ['member_id']) ??
      readString(root, ['member_id', 'MEMBER_ID']),
    refreshToken:
      readString(auth, ['refresh_token']) ??
      readString(root, ['REFRESH_ID', 'refresh_token']),
    applicationToken:
      readString(auth, ['application_token']) ??
      readString(root, ['application_token', 'APP_SID']),
    eventName: readString(root, ['event'])?.toUpperCase(),
    isExpanded: readIsExpanded(root),
  };
};
