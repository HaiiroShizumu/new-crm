import { isDefined } from 'twenty-shared/utils';
import { z } from 'zod';

import { type SmbBitrixConfig } from 'src/modules/smb-config/types/smb-bitrix-config.type';
import { type SmbLiveKitConfig } from 'src/modules/smb-config/types/smb-live-kit-config.type';
import { type SmbVapidConfig } from 'src/modules/smb-config/types/smb-vapid-config.type';

// docker compose passes unset variables as empty strings.
const optionalValue = z
  .string()
  .optional()
  .transform((value) => {
    const trimmedValue = value?.trim();

    return isDefined(trimmedValue) && trimmedValue.length > 0
      ? trimmedValue
      : undefined;
  });

const smbEnvSchema = z.object({
  LIVEKIT_URL: optionalValue,
  LIVEKIT_API_KEY: optionalValue,
  LIVEKIT_API_SECRET: optionalValue,
  VAPID_PUBLIC_KEY: optionalValue,
  VAPID_PRIVATE_KEY: optionalValue,
  VAPID_SUBJECT: optionalValue,
  SMB_BITRIX_CLIENT_ID: optionalValue,
  SMB_BITRIX_CLIENT_SECRET: optionalValue,
  SMB_BITRIX_AUTO_PROVISION_WORKSPACE: optionalValue,
});

type ParsedSmbEnv = {
  bitrix: SmbBitrixConfig | undefined;
  liveKit: SmbLiveKitConfig | undefined;
  vapid: SmbVapidConfig | undefined;
};

// A feature is either fully configured or off. Half a configuration is a
// deployment mistake, and it must stop the server instead of surfacing later
// as calls or notifications that silently do nothing.
const assertAllOrNone = (group: string, values: Record<string, unknown>) => {
  const names = Object.keys(values);
  const missingNames = names.filter((name) => !isDefined(values[name]));

  if (missingNames.length > 0 && missingNames.length < names.length) {
    throw new Error(
      `${group} is partially configured: set ${missingNames.join(', ')} or unset ${names
        .filter((name) => !missingNames.includes(name))
        .join(', ')}`,
    );
  }
};

export const parseSmbEnv = (
  env: Record<string, string | undefined>,
): ParsedSmbEnv => {
  const parsedEnv = smbEnvSchema.parse(env);

  const {
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT,
    SMB_BITRIX_CLIENT_ID,
    SMB_BITRIX_CLIENT_SECRET,
    SMB_BITRIX_AUTO_PROVISION_WORKSPACE,
  } = parsedEnv;

  assertAllOrNone('LiveKit', {
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
  });
  assertAllOrNone('Web Push', {
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT,
  });

  assertAllOrNone('Bitrix24', {
    SMB_BITRIX_CLIENT_ID,
    SMB_BITRIX_CLIENT_SECRET,
  });

  return {
    bitrix:
      isDefined(SMB_BITRIX_CLIENT_ID) && isDefined(SMB_BITRIX_CLIENT_SECRET)
        ? {
            clientId: SMB_BITRIX_CLIENT_ID,
            clientSecret: SMB_BITRIX_CLIENT_SECRET,
            shouldAutoProvisionWorkspace:
              SMB_BITRIX_AUTO_PROVISION_WORKSPACE === 'true',
          }
        : undefined,
    liveKit:
      isDefined(LIVEKIT_URL) &&
      isDefined(LIVEKIT_API_KEY) &&
      isDefined(LIVEKIT_API_SECRET)
        ? {
            url: LIVEKIT_URL,
            apiKey: LIVEKIT_API_KEY,
            apiSecret: LIVEKIT_API_SECRET,
          }
        : undefined,
    vapid:
      isDefined(VAPID_PUBLIC_KEY) &&
      isDefined(VAPID_PRIVATE_KEY) &&
      isDefined(VAPID_SUBJECT)
        ? {
            publicKey: VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
            subject: VAPID_SUBJECT,
          }
        : undefined,
  };
};
