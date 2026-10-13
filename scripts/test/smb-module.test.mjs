import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'smb-module.mjs',
);

// Минимальный каркас реестров с маркерами генератора — то, что `new` правит.
const buildSandbox = () => {
  const root = mkdtempSync(path.join(tmpdir(), 'smb-module-'));
  const write = (relativePath, content) => {
    const filePath = path.join(root, relativePath);

    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  };

  write(
    'packages/twenty-front/src/modules/smb-modules/registry.ts',
    '// smb:module:imports\nexport const MANIFESTS = [\n  // smb:module:list\n];\n',
  );
  write(
    'packages/twenty-server/src/modules/smb-modules/registry.ts',
    'export const SMB_SERVER_MODULE_MANIFESTS = [\n  // smb:module:manifests\n];\n',
  );
  write(
    'packages/twenty-server/src/modules/smb-server.module.ts',
    '// smb:module:imports\n@Module({ imports: [\n    // smb:module:list\n] })\nexport class SmbServerModule {}\n',
  );
  write(
    'packages/twenty-server/src/modules/smb-database/registry.ts',
    '// smb:module:migration-imports\nimport { type SmbMigration } from "x";\n\nexport const SMB_MIGRATIONS = [\n  // smb:module:migrations\n];\n',
  );
  write(
    'docs/PATCHES.md',
    '| P-001 | CLAUDE.md | раздел | why | нет | высокий |\n',
  );

  return root;
};

const runNew = (root, ...args) =>
  spawnSync('node', [SCRIPT, 'new', ...args], {
    env: { ...process.env, SMB_MODULE_ROOT: root },
    encoding: 'utf8',
  });

const read = (root, relativePath) =>
  readFileSync(path.join(root, relativePath), 'utf8');

test('new --server создаёт миграции модуля и подключает их в smb-database/registry.ts', () => {
  const root = buildSandbox();

  try {
    const result = runNew(root, 'absences', '--server');

    assert.equal(result.status, 0, result.stderr + result.stdout);

    const migrations = read(
      root,
      'packages/twenty-server/src/modules/smb-absences/migrations/smb-absences.migrations.ts',
    );

    assert.match(
      migrations,
      /export const SMB_ABSENCES_MIGRATIONS: SmbMigration\[\] = \[\];/,
    );
    assert.match(migrations, /ON DELETE CASCADE/);

    const registry = read(
      root,
      'packages/twenty-server/src/modules/smb-database/registry.ts',
    );

    assert.match(
      registry,
      /import \{ SMB_ABSENCES_MIGRATIONS \} from 'src\/modules\/smb-absences\/migrations\/smb-absences\.migrations';/,
    );
    // импорт — под своим маркером, спред — под маркером списка
    assert.ok(
      registry.indexOf('// smb:module:migration-imports') <
        registry.indexOf('import { SMB_ABSENCES_MIGRATIONS }'),
    );
    assert.ok(
      registry.indexOf('// smb:module:migrations') <
        registry.indexOf('...SMB_ABSENCES_MIGRATIONS,'),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('new без --server миграции не создаёт и реестр БД не трогает', () => {
  const root = buildSandbox();

  try {
    const before = read(
      root,
      'packages/twenty-server/src/modules/smb-database/registry.ts',
    );
    const result = runNew(root, 'feed');

    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(
      read(root, 'packages/twenty-server/src/modules/smb-database/registry.ts'),
      before,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
