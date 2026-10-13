import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

import { ResetPasswordService } from 'src/engine/core-modules/auth/services/reset-password.service';
import { LoginTokenService } from 'src/engine/core-modules/auth/token/services/login-token.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { SmbBitrixUserService } from 'src/modules/smb-bitrix/services/smb-bitrix-user.service';
import {
  SmbBitrixException,
  SmbBitrixExceptionCode,
} from 'src/modules/smb-bitrix/smb-bitrix.exception';
import { UserService } from 'src/engine/core-modules/user/services/user.service';
import { AuthProviderEnum } from 'src/engine/core-modules/workspace/types/workspace.type';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Injectable()
export class SmbBitrixCrmLinkService {
  constructor(
    private readonly bitrixUserService: SmbBitrixUserService,
    private readonly userService: UserService,
    private readonly resetPasswordService: ResetPasswordService,
    private readonly loginTokenService: LoginTokenService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {}

  // The address behind the "Open CRM" button of the embedded application. It
  // opens in a new tab, outside the portal: the iframe keeps its session in
  // partitioned storage that a top-level tab cannot see.
  // Someone who never set a password lands on the standard "set a password"
  // page with the email already filled in; everyone else is signed in directly.
  async createCrmLink({
    userId,
    workspace,
  }: {
    userId: string;
    workspace: WorkspaceEntity;
  }): Promise<string> {
    const isBitrixUser = await this.bitrixUserService.isBitrixUser({
      userId,
      workspaceId: workspace.id,
    });

    if (!isBitrixUser) {
      throw new SmbBitrixException(
        `User ${userId} is not bound to a portal of workspace ${workspace.id}`,
        SmbBitrixExceptionCode.NOT_A_BITRIX_USER,
      );
    }

    const user = await this.userService.findUserByIdOrThrow(userId);

    if (!isNonEmptyString(user.passwordHash)) {
      const generation =
        await this.resetPasswordService.generatePasswordResetToken(
          user.email,
          workspace.id,
        );

      if (generation.status === 'TOKEN_GENERATED') {
        await this.resetPasswordService.rotatePasswordResetToken({
          userId: user.id,
          resetToken: generation.resetToken,
        });

        return this.workspaceDomainsService
          .buildWorkspaceURL({
            workspace,
            pathname: getAppPath(AppPath.ResetPassword, {
              passwordResetToken: generation.resetToken.passwordResetToken,
            }),
          })
          .toString();
      }
    }

    const loginToken = await this.loginTokenService.generateLoginToken(
      user.email,
      workspace.id,
      AuthProviderEnum.Password,
    );

    return this.workspaceDomainsService
      .buildWorkspaceURL({
        workspace,
        pathname: AppPath.Verify,
        searchParams: { loginToken: loginToken.token },
      })
      .toString();
  }
}
