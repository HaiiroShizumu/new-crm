import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/engine/core-modules/auth/auth.module';
import { SubdomainManagerModule } from 'src/engine/core-modules/domain/subdomain-manager/subdomain-manager.module';
import { WorkspaceDomainsModule } from 'src/engine/core-modules/domain/workspace-domains/workspace-domains.module';
import { OnboardingModule } from 'src/engine/core-modules/onboarding/onboarding.module';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { SmbBitrixBindPortalCommand } from 'src/modules/smb-bitrix/commands/smb-bitrix-bind-portal.command';
import { SmbBitrixController } from 'src/modules/smb-bitrix/controllers/smb-bitrix.controller';
import { SmbBitrixRepository } from 'src/modules/smb-bitrix/repositories/smb-bitrix.repository';
import { SmbBitrixResolver } from 'src/modules/smb-bitrix/resolvers/smb-bitrix.resolver';
import { SmbBitrixCrmLinkService } from 'src/modules/smb-bitrix/services/smb-bitrix-crm-link.service';
import { SmbBitrixLaunchService } from 'src/modules/smb-bitrix/services/smb-bitrix-launch.service';
import { SmbBitrixOauthService } from 'src/modules/smb-bitrix/services/smb-bitrix-oauth.service';
import { SmbBitrixPortalService } from 'src/modules/smb-bitrix/services/smb-bitrix-portal.service';
import { SmbBitrixRestService } from 'src/modules/smb-bitrix/services/smb-bitrix-rest.service';
import { SmbBitrixUserService } from 'src/modules/smb-bitrix/services/smb-bitrix-user.service';
import { SmbBitrixTenantService } from 'src/modules/smb-bitrix/services/smb-bitrix-tenant.service';
import { SmbConfigModule } from 'src/modules/smb-config/smb-config.module';
import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { UserWorkspaceModule } from 'src/engine/core-modules/user-workspace/user-workspace.module';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserModule } from 'src/engine/core-modules/user/user.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceModule } from 'src/engine/core-modules/workspace/workspace.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, WorkspaceEntity]),
    AuthModule,
    OnboardingModule,
    SecretEncryptionModule,
    SecureHttpClientModule,
    SmbConfigModule,
    SubdomainManagerModule,
    ThrottlerModule,
    UserModule,
    UserWorkspaceModule,
    WorkspaceDomainsModule,
    WorkspaceModule,
  ],
  controllers: [SmbBitrixController],
  providers: [
    SmbBitrixRepository,
    SmbBitrixOauthService,
    SmbBitrixRestService,
    SmbBitrixPortalService,
    SmbBitrixUserService,
    SmbBitrixTenantService,
    SmbBitrixLaunchService,
    SmbBitrixCrmLinkService,
    SmbBitrixResolver,
    SmbBitrixBindPortalCommand,
  ],
})
export class SmbBitrixModule {}
