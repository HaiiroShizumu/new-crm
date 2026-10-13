// What oauth.bitrix.info returns for a refresh grant. Everything here is
// asserted by Bitrix24 itself for our client secret, unlike the request body.
export type SmbBitrixGrant = {
  memberId: string;
  restEndpoint: string;
  portalDomain: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  bitrixUserId: string | undefined;
};
