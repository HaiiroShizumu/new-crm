import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';
import { SmbHealthController } from 'src/modules/smb-modules/controllers/smb-health.controller';
import { SmbInstalledApplicationsCacheService } from 'src/modules/smb-modules/services/smb-installed-applications-cache.service';
import { SmbModulesVersionCheckService } from 'src/modules/smb-modules/services/smb-modules-version-check.service';

/**
 * Серверная инфраструктура модулей форка (M-4, M-7): кэш установленных App
 * для guard'а `@RequireSmbModule`, сверка версий App при старте и
 * `GET /healthz/smb` с её результатом.
 *
 * Глобальный: guard применяется к резолверам и контроллерам чужих модулей
 * ядра, поэтому кэш должен резолвиться в любом контексте (ADR-009 п.3).
 * Регистрируется в агрегаторе `src/modules/smb-server.module.ts` (шов P-002).
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApplicationEntity])],
  controllers: [SmbHealthController],
  providers: [
    SmbInstalledApplicationsCacheService,
    SmbModulesVersionCheckService,
    provideWorkspaceScopedRepository(ApplicationEntity),
  ],
  exports: [SmbInstalledApplicationsCacheService],
})
export class SmbModulesModule {}
