import { Module } from '@nestjs/common';

import { SmbMigrationRunnerService } from 'src/modules/smb-database/services/smb-migration-runner.service';

// Свои таблицы форка: схема `smb` и её миграции (ADR-013 п.2).
@Module({
  providers: [SmbMigrationRunnerService],
})
export class SmbDatabaseModule {}
