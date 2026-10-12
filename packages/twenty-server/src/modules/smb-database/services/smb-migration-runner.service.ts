import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type QueryRunner } from 'typeorm';

import {
  SMB_DATABASE_SCHEMA,
  SMB_MIGRATION_ADVISORY_LOCK_KEY,
  SMB_MIGRATION_LEDGER_TABLE,
} from 'src/modules/smb-database/constants/smb-database.constants';
import { SMB_MIGRATIONS } from 'src/modules/smb-database/registry';
import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

const LEDGER = `"${SMB_DATABASE_SCHEMA}"."${SMB_MIGRATION_LEDGER_TABLE}"`;

// Применяет миграции таблиц форка при старте процесса. Учёт — по имени в
// своём журнале, а не по курсору конвейера обновлений Twenty: тот запускает
// только шаги после последнего выполненного, и instance-команда форка,
// добавленная в уже пройденную версию, на живом сервере не выполнилась бы
// никогда (ADR-013 п.2).
@Injectable()
export class SmbMigrationRunnerService implements OnModuleInit {
  private readonly logger = new Logger(SmbMigrationRunnerService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.runPendingMigrations(SMB_MIGRATIONS);
  }

  async runPendingMigrations(
    migrations: readonly SmbMigration[],
  ): Promise<string[]> {
    this.assertUniqueNames(migrations);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      await queryRunner.query('SELECT pg_advisory_lock($1)', [
        SMB_MIGRATION_ADVISORY_LOCK_KEY,
      ]);

      try {
        return await this.runUnderLock(queryRunner, migrations);
      } finally {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [
          SMB_MIGRATION_ADVISORY_LOCK_KEY,
        ]);
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async runUnderLock(
    queryRunner: QueryRunner,
    migrations: readonly SmbMigration[],
  ): Promise<string[]> {
    // На пустой базе первым стартует CLI `upgrade`, который только создаёт
    // схему core; таблицы форка ссылаются на core.workspace, поэтому ждут
    // следующего старта (сервер поднимается после upgrade).
    // typeorm 0.3.31: query() перегружен и type-аргумента не принимает,
    // возвращаемый any приводим явно (иначе TS2558/TS2488).
    const coreReadyRows = (await queryRunner.query(
      `SELECT to_regclass('core.workspace') IS NOT NULL AS "isCoreReady"`,
    )) as { isCoreReady: boolean }[];
    const [{ isCoreReady }] = coreReadyRows;

    if (!isCoreReady) {
      this.logger.warn(
        'Схема core ещё не создана — миграции форка отложены до следующего старта.',
      );

      return [];
    }

    await queryRunner.query(
      `CREATE SCHEMA IF NOT EXISTS "${SMB_DATABASE_SCHEMA}"`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS ${LEDGER} (
        "name" character varying PRIMARY KEY,
        "appliedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )`,
    );

    const appliedRows = (await queryRunner.query(
      `SELECT "name" FROM ${LEDGER}`,
    )) as { name: string }[];
    const appliedNames = new Set(appliedRows.map((row) => row.name));
    const knownNames = new Set(migrations.map((migration) => migration.name));

    for (const appliedName of appliedNames) {
      if (!knownNames.has(appliedName)) {
        this.logger.warn(
          `В базе применена миграция форка '${appliedName}', которой нет в коде образа — образ старее базы.`,
        );
      }
    }

    const executedNames: string[] = [];

    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        continue;
      }

      await queryRunner.startTransaction();

      try {
        await migration.up(queryRunner);
        await queryRunner.query(`INSERT INTO ${LEDGER} ("name") VALUES ($1)`, [
          migration.name,
        ]);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();

        throw new Error(
          `Миграция форка '${migration.name}' не применена: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      executedNames.push(migration.name);
      this.logger.log(`Миграция форка применена: ${migration.name}`);
    }

    return executedNames;
  }

  private assertUniqueNames(migrations: readonly SmbMigration[]): void {
    const seenNames = new Set<string>();

    for (const migration of migrations) {
      if (seenNames.has(migration.name)) {
        throw new Error(
          `Имя миграции форка '${migration.name}' повторяется в реестре smb-database/registry.ts.`,
        );
      }

      seenNames.add(migration.name);
    }
  }
}
