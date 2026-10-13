import { Injectable } from '@nestjs/common';

import { isNonEmptyString, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { SMB_BITRIX_HTTP_TIMEOUT_MS } from 'src/modules/smb-bitrix/constants/smb-bitrix-http-timeout-ms.constant';
import { SMB_BITRIX_OAUTH_TOKEN_URL } from 'src/modules/smb-bitrix/constants/smb-bitrix-oauth-token-url.constant';
import {
  SmbBitrixException,
  SmbBitrixExceptionCode,
} from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { type SmbBitrixGrant } from 'src/modules/smb-bitrix/types/smb-bitrix-grant.type';
import { parseSmbBitrixRestEndpoint } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-rest-endpoint.util';
import { SmbConfigService } from 'src/modules/smb-config/smb-config.service';

const DEFAULT_EXPIRES_IN_SECONDS = 3600;

@Injectable()
export class SmbBitrixOauthService {
  constructor(
    private readonly secureHttpClientService: SecureHttpClientService,
    private readonly smbConfigService: SmbConfigService,
  ) {}

  // The one proof every Bitrix24 request has to pass. Nothing in the request
  // body is trusted: the refresh token is exchanged with our client secret, and
  // the portal id, its REST address and the tokens are taken from the answer of
  // oauth.bitrix.info. A token issued to another application or a made-up
  // member_id cannot get through.
  async exchangeRefreshToken(refreshToken: string): Promise<SmbBitrixGrant> {
    const bitrixConfig = this.smbConfigService.bitrix;

    if (!isDefined(bitrixConfig)) {
      throw new SmbBitrixException(
        'SMB_BITRIX_CLIENT_ID and SMB_BITRIX_CLIENT_SECRET are not set',
        SmbBitrixExceptionCode.NOT_CONFIGURED,
      );
    }

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: SMB_BITRIX_HTTP_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    let status: number;
    let data: unknown;

    try {
      const response = await httpClient.get(SMB_BITRIX_OAUTH_TOKEN_URL, {
        params: {
          grant_type: 'refresh_token',
          client_id: bitrixConfig.clientId,
          client_secret: bitrixConfig.clientSecret,
          refresh_token: refreshToken,
        },
      });

      status = response.status;
      data = response.data;
    } catch {
      // The request URL carries the client secret, so the original error is not rethrown or logged.
      throw new SmbBitrixException(
        'oauth.bitrix.info is unreachable',
        SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED,
      );
    }

    if (status >= 500) {
      throw new SmbBitrixException(
        `oauth.bitrix.info answered ${status}`,
        SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED,
      );
    }

    const grant = this.parseGrant(data);

    if (status !== 200 || !isDefined(grant)) {
      throw new SmbBitrixException(
        `Refresh token was not accepted (HTTP ${status})`,
        SmbBitrixExceptionCode.PORTAL_PROOF_FAILED,
      );
    }

    return grant;
  }

  private parseGrant(data: unknown): SmbBitrixGrant | undefined {
    if (!isObject(data)) {
      return undefined;
    }

    const record = data as Record<string, unknown>;
    const endpoint = parseSmbBitrixRestEndpoint(record.client_endpoint);

    if (
      !isDefined(endpoint) ||
      !isNonEmptyString(record.member_id) ||
      !isNonEmptyString(record.access_token) ||
      !isNonEmptyString(record.refresh_token)
    ) {
      return undefined;
    }

    const expiresInSeconds = Number(record.expires_in);
    const rawUserId = record.user_id;

    return {
      memberId: record.member_id,
      restEndpoint: endpoint.restEndpoint,
      portalDomain: endpoint.portalDomain,
      accessToken: record.access_token,
      refreshToken: record.refresh_token,
      expiresAt: new Date(
        Date.now() +
          (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
            ? expiresInSeconds
            : DEFAULT_EXPIRES_IN_SECONDS) *
            1000,
      ),
      bitrixUserId:
        typeof rawUserId === 'number'
          ? String(rawUserId)
          : isNonEmptyString(rawUserId)
            ? rawUserId
            : undefined,
    };
  }
}
