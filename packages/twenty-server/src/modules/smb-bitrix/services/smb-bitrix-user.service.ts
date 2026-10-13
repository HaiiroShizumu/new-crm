import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { OnboardingService } from 'src/engine/core-modules/onboarding/onboarding.service';
import { SmbBitrixRepository } from 'src/modules/smb-bitrix/repositories/smb-bitrix.repository';
import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';
import { type SmbBitrixUserRow } from 'src/modules/smb-bitrix/types/smb-bitrix-user-row.type';
import { type SmbBitrixPerson } from 'src/modules/smb-bitrix/types/smb-bitrix-person.type';
import { type SmbBitrixUserResolution } from 'src/modules/smb-bitrix/types/smb-bitrix-user-resolution.type';
import { isSmbBitrixAccountSafeToLink } from 'src/modules/smb-bitrix/utils/is-smb-bitrix-account-safe-to-link.util';
import { UserWorkspaceService } from 'src/engine/core-modules/user-workspace/user-workspace.service';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

const NEW_ACCOUNT_LOCALE = 'ru-RU';

@Injectable()
export class SmbBitrixUserService {
  private readonly logger = new Logger(SmbBitrixUserService.name);

  constructor(
    private readonly bitrixRepository: SmbBitrixRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UserService,
    private readonly userWorkspaceService: UserWorkspaceService,
    private readonly onboardingService: OnboardingService,
  ) {}

  private async findBinding({
    portalId,
    bitrixUserId,
  }: {
    portalId: string;
    bitrixUserId: string;
  }): Promise<SmbBitrixUserRow | null> {
    return this.bitrixRepository.findUserBinding(portalId, bitrixUserId);
  }

  async findBoundUser({
    portalId,
    bitrixUserId,
  }: {
    portalId: string;
    bitrixUserId: string;
  }): Promise<UserEntity | null> {
    const binding = await this.findBinding({ portalId, bitrixUserId });

    return isDefined(binding)
      ? this.userService.findUserById(binding.userId)
      : null;
  }

  async isBitrixUser({
    userId,
    workspaceId,
  }: {
    userId: string;
    workspaceId: string;
  }): Promise<boolean> {
    return this.bitrixRepository.isUserBoundToActivePortal({
      userId,
      workspaceId,
    });
  }

  // Finds the account of a portal employee or creates it. Safe to call again
  // for the same person: the install-time sync and the first opening of the
  // application can race, and both must end with one account and one binding.
  async resolveUser({
    portal,
    workspace,
    person,
  }: {
    portal: SmbBitrixPortalRow;
    workspace: WorkspaceEntity;
    person: SmbBitrixPerson;
  }): Promise<SmbBitrixUserResolution> {
    const boundUser = await this.findBoundUser({
      portalId: portal.id,
      bitrixUserId: person.bitrixUserId,
    });

    if (isDefined(boundUser)) {
      await this.ensureMembership(boundUser, workspace);

      return { status: 'RESOLVED', user: boundUser };
    }

    if (!isDefined(person.email)) {
      return { status: 'EMAIL_MISSING' };
    }

    const existingUser = await this.userService.findUserByEmailWithWorkspaces(
      person.email,
    );

    if (
      isDefined(existingUser) &&
      !isSmbBitrixAccountSafeToLink({
        candidate: {
          canImpersonate: existingUser.canImpersonate,
          canAccessFullAdminPanel: existingUser.canAccessFullAdminPanel,
          workspaceIds: (existingUser.userWorkspaces ?? []).map(
            (userWorkspace) => userWorkspace.workspaceId,
          ),
        },
        workspaceId: workspace.id,
      })
    ) {
      return { status: 'ACCOUNT_LINK_REQUIRED', email: person.email };
    }

    const user = existingUser ?? (await this.createUser(person, person.email));

    await this.ensureMembership(user, workspace);

    const isBound = await this.bind({
      portalId: portal.id,
      bitrixUserId: person.bitrixUserId,
      userId: user.id,
    });

    // The account is already bound to another employee of this portal: two
    // Bitrix24 profiles share one email, and only the first one gets it.
    return isBound
      ? { status: 'RESOLVED', user }
      : { status: 'ACCOUNT_LINK_REQUIRED', email: person.email };
  }

  // The installer becomes the owner of a workspace that does not exist yet, so
  // the account must not belong to any workspace at all.
  async resolveOwnerAccount(
    person: SmbBitrixPerson,
  ): Promise<UserEntity | undefined> {
    if (!isDefined(person.email)) {
      return undefined;
    }

    const existingUser = await this.userService.findUserByEmailWithWorkspaces(
      person.email,
    );

    if (!isDefined(existingUser)) {
      return this.createUser(person, person.email);
    }

    const hasNoWorkspace = (existingUser.userWorkspaces ?? []).length === 0;

    return hasNoWorkspace &&
      !existingUser.canImpersonate &&
      !existingUser.canAccessFullAdminPanel
      ? existingUser
      : undefined;
  }

  private async createUser(
    person: SmbBitrixPerson,
    email: string,
  ): Promise<UserEntity> {
    // isEmailVerified: the portal vouches for its employee, and the account
    // has no password. Without it a server that requires verified emails
    // would lock every employee out of the application they just opened.
    await this.userRepository
      .createQueryBuilder()
      .insert()
      .values({
        email,
        firstName: person.firstName,
        lastName: person.lastName,
        locale: NEW_ACCOUNT_LOCALE,
        isEmailVerified: true,
      })
      .orIgnore()
      .execute();

    return this.userService.findUserByEmailOrThrow(email);
  }

  private async ensureMembership(
    user: UserEntity,
    workspace: WorkspaceEntity,
  ): Promise<void> {
    const userWorkspace =
      await this.userWorkspaceService.checkUserWorkspaceExists(
        user.id,
        workspace.id,
      );

    if (isDefined(userWorkspace)) {
      return;
    }

    await this.userWorkspaceService.addUserToWorkspaceIfUserNotInWorkspace(
      user,
      workspace,
    );

    // The name came from the portal, so the "create your profile" screen
    // would only stand between the employee and the application.
    await this.onboardingService.setOnboardingCreateProfilePending({
      userId: user.id,
      workspaceId: workspace.id,
      value: false,
    });
  }

  private async bind({
    portalId,
    bitrixUserId,
    userId,
  }: {
    portalId: string;
    bitrixUserId: string;
    userId: string;
  }): Promise<boolean> {
    await this.bitrixRepository.insertUserBindingIfAbsent({
      portalId,
      bitrixUserId,
      userId,
    });

    const binding = await this.findBinding({ portalId, bitrixUserId });

    if (!isDefined(binding) || binding.userId !== userId) {
      this.logger.warn(
        `Portal ${portalId}: Bitrix24 user ${bitrixUserId} could not be bound to user ${userId}`,
      );

      return false;
    }

    return true;
  }
}
