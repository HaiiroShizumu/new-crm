import { type QueryRunner } from 'typeorm';

// Имя — `<модуль>/<NNNN>-<что-делает>`; по нему миграция считается применённой,
// поэтому имя и тело применённой миграции не меняются — только новая строка.
export type SmbMigration = {
  name: string;
  up: (queryRunner: QueryRunner) => Promise<void>;
};
