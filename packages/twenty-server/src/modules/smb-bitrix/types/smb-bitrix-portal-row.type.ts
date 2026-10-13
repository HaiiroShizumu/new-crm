import { type SmbBitrixPortalStatus } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-status.type';

// Строка `smb.bitrixPortal`. Таблица уровня инстанса: у приложения один адрес на
// все порталы, и именно эта строка говорит, какой компании принадлежит запрос.
// Поэтому `workspaceId` здесь nullable — портал появляется раньше компании.
export type SmbBitrixPortalRow = {
  id: string;
  // Не меняется при переименовании портала, в отличие от домена.
  memberId: string;
  domain: string;
  restEndpoint: string;
  status: SmbBitrixPortalStatus;
  workspaceId: string | null;
  encryptedAccessToken: string | null;
  encryptedRefreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  encryptedApplicationToken: string | null;
  usersSyncedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};
