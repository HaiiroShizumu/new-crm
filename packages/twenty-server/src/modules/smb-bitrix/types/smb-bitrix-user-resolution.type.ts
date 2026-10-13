import { type UserEntity } from 'src/engine/core-modules/user/user.entity';

export type SmbBitrixUserResolution =
  | { status: 'RESOLVED'; user: UserEntity }
  | { status: 'EMAIL_MISSING' }
  | { status: 'ACCOUNT_LINK_REQUIRED'; email: string };
