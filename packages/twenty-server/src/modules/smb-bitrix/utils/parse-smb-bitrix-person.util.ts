import { isNonEmptyString, isObject } from '@sniptt/guards';

import { type SmbBitrixPerson } from 'src/modules/smb-bitrix/types/smb-bitrix-person.type';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readText = (record: Record<string, unknown>, key: string): string => {
  const value = record[key];

  return isNonEmptyString(value) ? value.trim() : '';
};

export const parseSmbBitrixPerson = (
  value: unknown,
): SmbBitrixPerson | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const rawId = record.ID;
  const bitrixUserId =
    typeof rawId === 'number' ? String(rawId) : readText(record, 'ID');

  if (bitrixUserId.length === 0) {
    return undefined;
  }

  const email = readText(record, 'EMAIL').toLowerCase();

  return {
    bitrixUserId,
    email: EMAIL_PATTERN.test(email) ? email : undefined,
    firstName: readText(record, 'NAME'),
    lastName: readText(record, 'LAST_NAME'),
  };
};
