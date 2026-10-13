// Строка `smb.bitrixUser`. Личность сотрудника портала — пара (портал,
// bitrixUserId). Email используется один раз, чтобы создать или найти аккаунт;
// последующие входы на него не смотрят.
export type SmbBitrixUserRow = {
  id: string;
  portalId: string;
  bitrixUserId: string;
  userId: string;
  createdAt: Date;
};
