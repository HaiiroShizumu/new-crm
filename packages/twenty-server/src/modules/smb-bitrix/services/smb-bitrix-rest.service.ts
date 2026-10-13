import { Injectable } from '@nestjs/common';

import { isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { resolveAndValidateHostname } from 'src/engine/core-modules/secure-http-client/utils/resolve-and-validate-hostname.util';
import { SMB_BITRIX_HTTP_TIMEOUT_MS } from 'src/modules/smb-bitrix/constants/smb-bitrix-http-timeout-ms.constant';
import {
  SMB_BITRIX_USER_PAGE_SIZE,
  SMB_BITRIX_USER_SYNC_MAX_PAGES,
} from 'src/modules/smb-bitrix/constants/smb-bitrix-user-sync.constant';
import {
  SmbBitrixException,
  SmbBitrixExceptionCode,
} from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { type SmbBitrixGrant } from 'src/modules/smb-bitrix/types/smb-bitrix-grant.type';
import { type SmbBitrixPerson } from 'src/modules/smb-bitrix/types/smb-bitrix-person.type';
import { parseSmbBitrixPerson } from 'src/modules/smb-bitrix/utils/parse-smb-bitrix-person.util';

type SmbBitrixRestMethod = 'user.current' | 'user.admin' | 'user.get';

type SmbBitrixRestAnswer = {
  result: unknown;
  next: number | undefined;
};

type SmbBitrixRestTarget = Pick<
  SmbBitrixGrant,
  'restEndpoint' | 'portalDomain' | 'accessToken'
>;

@Injectable()
export class SmbBitrixRestService {
  constructor(
    private readonly secureHttpClientService: SecureHttpClientService,
  ) {}

  async getCurrentPerson(
    target: SmbBitrixRestTarget,
  ): Promise<SmbBitrixPerson> {
    const { result } = await this.call(target, 'user.current');
    const person = parseSmbBitrixPerson(result);

    if (!isDefined(person)) {
      throw new SmbBitrixException(
        'user.current returned no user id',
        SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED,
      );
    }

    return person;
  }

  async isCurrentPersonAdmin(target: SmbBitrixRestTarget): Promise<boolean> {
    const { result } = await this.call(target, 'user.admin');

    return result === true;
  }

  async listActiveEmployees(
    target: SmbBitrixRestTarget,
  ): Promise<SmbBitrixPerson[]> {
    const people: SmbBitrixPerson[] = [];
    let start: number | undefined = 0;

    for (
      let pageIndex = 0;
      pageIndex < SMB_BITRIX_USER_SYNC_MAX_PAGES && isDefined(start);
      pageIndex++
    ) {
      const { result, next } = await this.call(target, 'user.get', {
        FILTER: { ACTIVE: true, USER_TYPE: 'employee' },
        start,
      });

      const page = Array.isArray(result) ? result : [];

      people.push(...page.map(parseSmbBitrixPerson).filter(isDefined));

      start = page.length < SMB_BITRIX_USER_PAGE_SIZE ? undefined : next;
    }

    return people;
  }

  private async call(
    target: SmbBitrixRestTarget,
    method: SmbBitrixRestMethod,
    params: Record<string, unknown> = {},
  ): Promise<SmbBitrixRestAnswer> {
    // Checked on every call and regardless of OUTBOUND_HTTP_SAFE_MODE_ENABLED:
    // an on-premise portal lives on any domain, and that domain must never
    // resolve to this server's own network.
    try {
      await resolveAndValidateHostname(target.portalDomain);
    } catch {
      throw new SmbBitrixException(
        `Portal host ${target.portalDomain} is not reachable from outside`,
        SmbBitrixExceptionCode.PORTAL_PROOF_FAILED,
      );
    }

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: SMB_BITRIX_HTTP_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
    });

    let data: unknown;

    try {
      // The token travels in the body so it never lands in access logs.
      const response = await httpClient.post(
        `${target.restEndpoint}${method}`,
        {
          ...params,
          auth: target.accessToken,
        },
      );

      data = response.data;
    } catch {
      throw new SmbBitrixException(
        `${method} request failed`,
        SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED,
      );
    }

    if (!isObject(data) || !('result' in data) || 'error' in data) {
      throw new SmbBitrixException(
        `${method} returned an error`,
        SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED,
      );
    }

    const record = data as Record<string, unknown>;

    return {
      result: record.result,
      next: typeof record.next === 'number' ? record.next : undefined,
    };
  }
}
