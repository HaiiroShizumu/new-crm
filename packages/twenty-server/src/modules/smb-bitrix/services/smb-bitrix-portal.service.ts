import { Injectable } from '@nestjs/common';

import { createHash, timingSafeEqual } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import {
  type EncryptedString,
  type PlaintextString,
} from 'src/engine/core-modules/secret-encryption/branded-strings';
import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';
import { SmbBitrixRepository } from 'src/modules/smb-bitrix/repositories/smb-bitrix.repository';
import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';
import { type SmbBitrixGrant } from 'src/modules/smb-bitrix/types/smb-bitrix-grant.type';

const LAST_ERROR_MAX_LENGTH = 500;

@Injectable()
export class SmbBitrixPortalService {
  constructor(
    private readonly bitrixRepository: SmbBitrixRepository,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  async findByMemberId(memberId: string): Promise<SmbBitrixPortalRow | null> {
    return this.bitrixRepository.findPortalByMemberId(memberId);
  }

  async findActiveByWorkspaceId(
    workspaceId: string,
  ): Promise<SmbBitrixPortalRow[]> {
    return this.bitrixRepository.findActivePortalsByWorkspaceId(workspaceId);
  }

  // Runs on every verified request: the refresh grant rotates the tokens, and
  // the stored pair is what the background user sync works with.
  async upsertFromGrant(grant: SmbBitrixGrant): Promise<SmbBitrixPortalRow> {
    return this.bitrixRepository.upsertPortalTokens({
      memberId: grant.memberId,
      domain: grant.portalDomain,
      restEndpoint: grant.restEndpoint,
      encryptedAccessToken: this.encrypt(grant.accessToken),
      encryptedRefreshToken: this.encrypt(grant.refreshToken),
      accessTokenExpiresAt: grant.expiresAt,
    });
  }

  async bindToWorkspace(
    portalId: string,
    workspaceId: string,
  ): Promise<SmbBitrixPortalRow> {
    await this.bitrixRepository.updatePortal(portalId, {
      workspaceId,
      status: 'ACTIVE',
      lastError: null,
    });

    const portal = await this.bitrixRepository.findPortalById(portalId);

    if (!isDefined(portal)) {
      throw new Error(`Bitrix24 portal ${portalId} disappeared while binding`);
    }

    return portal;
  }

  async markReinstalled(portalId: string): Promise<void> {
    await this.bitrixRepository.updatePortal(
      portalId,
      { status: 'ACTIVE' },
      { onlyIfStatus: 'UNINSTALLED' },
    );
  }

  async markUninstalled(portalId: string): Promise<void> {
    await this.bitrixRepository.updatePortal(portalId, {
      status: 'UNINSTALLED',
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      accessTokenExpiresAt: null,
    });
  }

  async markUsersSynced(portalId: string): Promise<void> {
    await this.bitrixRepository.updatePortal(portalId, {
      usersSyncedAt: new Date(),
      lastError: null,
    });
  }

  async saveError(portalId: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);

    await this.bitrixRepository.updatePortal(portalId, {
      lastError: message.slice(0, LAST_ERROR_MAX_LENGTH),
    });
  }

  // Stored once and never replaced by a later request: whoever learns the
  // member_id must not be able to swap the token and then uninstall the portal.
  async saveApplicationTokenIfAbsent(
    portal: SmbBitrixPortalRow,
    applicationToken: string,
  ): Promise<void> {
    if (isNonEmptyString(portal.encryptedApplicationToken)) {
      return;
    }

    await this.bitrixRepository.updatePortal(portal.id, {
      encryptedApplicationToken: this.encrypt(applicationToken),
    });
  }

  isApplicationTokenValid(
    portal: SmbBitrixPortalRow,
    providedToken: string | undefined,
  ): boolean {
    if (
      !isNonEmptyString(providedToken) ||
      !isNonEmptyString(portal.encryptedApplicationToken)
    ) {
      return false;
    }

    const storedToken = this.decrypt(portal.encryptedApplicationToken);

    if (!isDefined(storedToken)) {
      return false;
    }

    // Digests first, so timingSafeEqual always compares buffers of one length.
    return timingSafeEqual(
      createHash('sha256').update(providedToken).digest(),
      createHash('sha256').update(storedToken).digest(),
    );
  }

  private encrypt(value: string): string {
    return this.secretEncryptionService.encryptVersioned(
      value as PlaintextString,
    );
  }

  private decrypt(value: string): string | undefined {
    try {
      return this.secretEncryptionService.decryptVersionedOrThrow(
        value as EncryptedString,
      );
    } catch {
      return undefined;
    }
  }
}
