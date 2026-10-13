#!/usr/bin/env node
/**
 * Генератор каркаса модуля форка (ADR-009, задача M-5) и команды модулей (M-6).
 *
 *   yarn smb:module new <key> [--display-name "Название"] [--server]
 *   yarn smb:module list
 *   yarn smb:module disable <key> [--workspace <uuid>] [--dry-run] [--delete-data --yes]
 *
 * `new` создаёт части модуля и вставляет строки в наши реестры:
 *   app/     packages/twenty-apps/smb/<key>/                 App: объекты, поля, роли, workflows
 *   front/   packages/twenty-front/src/modules/smb-<key>/    страницы + манифест
 *            + import и строка в smb-modules/registry.ts
 *   server/  packages/twenty-server/src/modules/smb-<key>/   (флаг --server)
 *            + импорт и строка в smb-server.module.ts; манифест
 *            (key, uuid, версия) — в smb-modules/registry.ts, он же нужен
 *            guard'у @RequireSmbModule и проверке версии при старте (M-7)
 *
 * `disable` снимает доступ (назначения ролей App), данные не удаляет:
 * удаление — только явным --delete-data с подтверждением (ADR-009 п.3).
 */
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { readServerEnv, runMetadataGraphql } from './lib/smb-api.mjs';

// SMB_MODULE_ROOT — только для теста генератора (scripts/test/smb-module.test.mjs):
// он гоняет `new` на копии каркаса реестров, а не на настоящем дереве.
const REPO_ROOT = process.env.SMB_MODULE_ROOT
  ? path.resolve(process.env.SMB_MODULE_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONT_MODULES_DIR = path.join(
  REPO_ROOT,
  'packages/twenty-front/src/modules',
);
const FRONT_REGISTRY = path.join(FRONT_MODULES_DIR, 'smb-modules/registry.ts');
const APPS_DIR = path.join(REPO_ROOT, 'packages/twenty-apps/smb');
const SERVER_MODULES_DIR = path.join(
  REPO_ROOT,
  'packages/twenty-server/src/modules',
);
const SERVER_REGISTRY = path.join(SERVER_MODULES_DIR, 'smb-server.module.ts');
const SERVER_MANIFEST_REGISTRY = path.join(
  SERVER_MODULES_DIR,
  'smb-modules/registry.ts',
);
const SERVER_MIGRATIONS_REGISTRY = path.join(
  SERVER_MODULES_DIR,
  'smb-database/registry.ts',
);
const PATCHES = path.join(REPO_ROOT, 'docs/PATCHES.md');

// Версия App по умолчанию: та же самая пишется в package.json App и в
// серверный реестр (сверка «версия App ↔ код образа», M-7).
const APP_VERSION = '0.1.0';

const KEY_PATTERN = /^[a-z][a-z0-9-]{1,32}$/;
const IMPORTS_MARKER = '// smb:module:imports';
const LIST_MARKER = '// smb:module:list';
const MANIFEST_MARKER = '// smb:module:manifests';
const MIGRATIONS_IMPORTS_MARKER = '// smb:module:migration-imports';
const MIGRATIONS_MARKER = '// smb:module:migrations';
const SERVER_PATCH_PATH = 'packages/twenty-server/src/modules/smb-*';
const APP_PATCH_PATH = 'packages/twenty-apps/smb/';

const fail = (message) => {
  console.error(`smb:module: ${message}`);
  process.exit(1);
};

const relative = (filePath) => path.relative(REPO_ROOT, filePath);

const pascalCase = (key) =>
  key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const constName = (key) =>
  `SMB_${key.replace(/-/g, '_').toUpperCase()}_MODULE_MANIFEST`;

const migrationsConstName = (key) =>
  `SMB_${key.replace(/-/g, '_').toUpperCase()}_MIGRATIONS`;

const writeFile = (filePath, content) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  console.log(`  + ${relative(filePath)}`);
};

const insertAfterMarker = (filePath, marker, line) => {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  // Маркер — отдельная строка файла: в комментариях те же слова встречаются
  // в тексте, и поиск подстроки вставил бы строку в комментарий.
  const markerLineIndex = lines.findIndex((item) => item.trim() === marker);

  if (markerLineIndex === -1) {
    fail(`не найден маркер '${marker}' в ${relative(filePath)}`);
  }

  if (content.includes(line.trim())) {
    console.log(`  = ${relative(filePath)} (строка уже есть)`);
    return;
  }

  lines.splice(markerLineIndex + 1, 0, line);
  writeFileSync(filePath, lines.join('\n'));
  console.log(`  * ${relative(filePath)}`);
};

const ensurePatchRow = (patchPath, why) => {
  const content = readFileSync(PATCHES, 'utf8');

  if (content.includes(patchPath)) {
    console.log(`  = ${relative(PATCHES)} (запись '${patchPath}' уже есть)`);
    return;
  }

  const ids = [...content.matchAll(/^\|\s*P-(\d+)\s*\|/gm)].map((match) =>
    Number.parseInt(match[1], 10),
  );
  const nextId = `P-${String(Math.max(0, ...ids) + 1).padStart(3, '0')}`;
  const row =
    `| ${nextId} | ${patchPath} | ${why} | ` +
    'каталог новый и наш по ADR-009, но пока вне списка OURS гейта — ' +
    'расширение OURS идёт отдельным коммитом с ревью владельца (M-1) | ' +
    'нет | низкий |\n';

  const rows = [...content.matchAll(/^\| P-\d+ \|.*\n/gm)];
  const lastRow = rows[rows.length - 1];

  if (!lastRow) {
    fail('в docs/PATCHES.md не найдена таблица реестра');
  }

  const insertAt = lastRow.index + lastRow[0].length;
  const updated = content.slice(0, insertAt) + row + content.slice(insertAt);

  writeFileSync(PATCHES, updated);
  console.log(`  * ${relative(PATCHES)} (+${nextId})`);
};

const frontManifest = ({ key, displayName, manifestConst, appUuid }) =>
  `import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

export const ${manifestConst} = {
  key: '${key}',
  applicationUniversalIdentifier: '${appUuid}',
  dependsOn: [],
  routes: [
    {
      path: '/${key}',
      // именованный экспорт страницы -> контракт React.lazy
      loader: () =>
        import('@/smb-${key}/pages/${pascalCase(key)}Page').then(
          (module) => ({ default: module.${pascalCase(key)}Page }),
        ),
    },
  ],
  navigation: [
    {
      labelKey: '${key}.title',
      icon: 'IconBox',
      to: '/${key}',
      group: 'company',
    },
  ],
  recordTabs: [],
  embed: null,
} as const satisfies SmbModuleManifest;
`;

// В шаблоне ниже нет подстановок JS: страница — обычный текст, иначе
// генератор интерполировал бы содержимое чужого шаблона, а linaria в
// двадцать-front типизирует theme иначе (см. themeCssVariables в скине).
const frontPage = ({ key, displayName }) =>
  PAGE_TEMPLATE.replaceAll('__PASCAL__', pascalCase(key)).replaceAll(
    '__DISPLAY__',
    displayName.replaceAll('`', ''),
  );

const PAGE_TEMPLATE = `import { Trans } from '@lingui/react/macro';

import { styled } from '@linaria/react';

const Styled__PASCAL__Page = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: auto;
  padding: 16px;
\`;

export const __PASCAL__Page = () => (
  <Styled__PASCAL__Page>
    <Trans>__DISPLAY__</Trans>
  </Styled__PASCAL__Page>
);
`;

const appPackageJson = ({ key, displayName }) =>
  `${JSON.stringify(
    {
      name: key,
      version: APP_VERSION,
      license: 'AGPL-3.0-only',
      engines: {
        node: '^24.5.0',
        npm: 'please-use-yarn',
        yarn: '>=4.0.2',
      },
      packageManager: 'yarn@4.13.0',
      scripts: {
        twenty: 'twenty',
        lint: 'oxlint -c .oxlintrc.json .',
        'lint:fix': 'oxlint --fix -c .oxlintrc.json .',
      },
      dependencies: {},
      devDependencies: {
        '@types/node': '^24.7.2',
        '@types/react': '^18.2.0',
        oxlint: '^0.16.0',
        react: '^18.2.0',
        'twenty-client-sdk': '2.13.0',
        'twenty-sdk': '2.13.0',
        typescript: '^5.9.3',
      },
    },
    null,
    2,
  )}\n`;

const appTsconfig = () =>
  `${JSON.stringify(
    {
      compileOnSave: false,
      compilerOptions: {
        sourceMap: true,
        declaration: true,
        outDir: './dist',
        rootDir: '.',
        jsx: 'react-jsx',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        importHelpers: true,
        allowUnreachableCode: false,
        strict: true,
        alwaysStrict: true,
        noImplicitAny: true,
        strictBindCallApply: false,
        target: 'es2018',
        module: 'esnext',
        lib: ['es2020', 'dom'],
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        resolveJsonModule: true,
        paths: { 'src/*': ['./src/*'], '~/*': ['./*'] },
      },
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts'],
    },
    null,
    2,
  )}\n`;

const appOxlintrc = () =>
  `${JSON.stringify(
    {
      $schema: './node_modules/oxlint/configuration_schema.json',
      plugins: ['typescript'],
      categories: { correctness: 'off' },
      ignorePatterns: ['node_modules', 'dist'],
      rules: {
        'no-unused-vars': 'off',
        'typescript/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'typescript/no-explicit-any': 'off',
      },
    },
    null,
    2,
  )}\n`;

const appGitignore = () =>
  `# dependencies
/node_modules
.yarn

# codegen
generated

# dev
/dist/
.twenty

# env files
.env*

# typescript
*.tsbuildinfo
*.d.ts
`;

const appApplicationConfig = ({ displayName, appUuid, roleUuid }) =>
  `import { defineApplication } from 'twenty-sdk/define';
import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/roles/default-role';

export const APPLICATION_UNIVERSAL_IDENTIFIER = '${appUuid}';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: '${displayName.replace(/'/g, "\\'")}',
  description: '',
  defaultRoleUniversalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
});
`;

const appDefaultRole = ({ key, roleUuid }) =>
  `import { defineRole } from 'twenty-sdk/define';

export const DEFAULT_ROLE_UNIVERSAL_IDENTIFIER = '${roleUuid}';

export default defineRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: '${key} default role',
  description: '${key} default role',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
});
`;

const appReadme = ({ key, displayName, appUuid }) =>
  `# ${displayName} (smb-${key})

App модуля **${key}** — данные (объекты, поля, вью, роли, workflows), доставляемые
через механизм Apps Twenty. Фронт-часть модуля: \`packages/twenty-front/src/modules/smb-${key}/\`,
серверная (если нужна): \`packages/twenty-server/src/modules/smb-${key}/\`.

- universalIdentifier: \`${appUuid}\`
- Установка: \`twenty app apply\` (см. \`docs/dev/module-authoring.md\`)
- Модуль включён в компании тогда и только тогда, когда этот App установлен (ADR-009 п.3)
`;

const serverModule = ({ key }) =>
  `import { Module } from '@nestjs/common';

// Серверная часть модуля '${key}' (ADR-009 п.1): PRE-хуки, резолверы, REST,
// свои таблицы, фоновые задачи. Генератор уже вставил этот модуль в
// smb-server.module.ts, а манифест (key, uuid, версию) — в
// smb-modules/registry.ts; guard @RequireSmbModule('${key}') работает сразу.
@Module({})
export class Smb${pascalCase(key)}Module {}
`;

const serverMigrations = ({ key }) =>
  `import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

// Таблицы модуля '${key}' в схеме smb (ADR-013 п.2). Правила:
//   * имя — '${key}/<NNNN>-<что делает>', порядок задаёт список;
//   * применённую миграцию не править — добавлять новую;
//   * у каждой таблицы "workspaceId" uuid NOT NULL с
//     REFERENCES "core"."workspace"("id") ON DELETE CASCADE;
//   * instance-команды (@RegisteredInstanceCommand) не писать — на обновлённом
//     сервере они не выполнятся.
export const ${migrationsConstName(key)}: SmbMigration[] = [];
`;

const parseArgs = (argv) => {
  const options = {
    displayName: undefined,
    server: false,
    workspace: undefined,
    dryRun: false,
    deleteData: false,
    yes: false,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--server') {
      options.server = true;
      continue;
    }

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (argument === '--delete-data') {
      options.deleteData = true;
      continue;
    }

    if (argument === '--yes') {
      options.yes = true;
      continue;
    }

    if (argument === '--workspace') {
      options.workspace = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--display-name') {
      options.displayName = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith('--')) {
      fail(`неизвестный флаг '${argument}'`);
    }

    positional.push(argument);
  }

  return { positional, options };
};

const listModules = () => {
  const content = readFileSync(FRONT_REGISTRY, 'utf8');
  const imports = [
    ...content.matchAll(/^import \{ \w+ \} from '(@\/smb-[^']+)';$/gm),
  ].map((match) => match[1]);

  if (imports.length === 0) {
    console.log('Реестр модулей пуст.');
    return;
  }

  console.log('Зарегистрированные модули:');

  for (const modulePath of imports) {
    const manifestFile = path.join(
      FRONT_MODULES_DIR,
      `${modulePath.slice(2)}.ts`,
    );
    let key = '?';
    let appUuid = '?';

    if (existsSync(manifestFile)) {
      const manifest = readFileSync(manifestFile, 'utf8');
      key = manifest.match(/key: '([^']+)'/)?.[1] ?? '?';
      appUuid =
        manifest.match(/applicationUniversalIdentifier: '([^']+)'/)?.[1] ?? '?';
    }

    console.log(`  - ${key}  app=${appUuid}  ${modulePath}`);
  }
};

// ---------------------------------------------------------------------------
// yarn smb:module disable (M-6): снимает доступ к модулю — назначения ролей
// его App; сами данные не трогает. Удаление данных — только отдельным явным
// шагом --delete-data с подтверждением (ADR-009 п.3).
// ---------------------------------------------------------------------------

// Ключ → universalIdentifier App. Источники по убыванию доверия: сам App
// (ADR-009 п.2 — там лежит APPLICATION_UNIVERSAL_IDENTIFIER), затем манифест
// фронта, затем серверный реестр (модуль может быть только app/ или только server/).
const resolveModuleApplicationUuid = (key) => {
  const candidates = [
    {
      file: path.join(APPS_DIR, key, 'src/application-config.ts'),
      pattern: /APPLICATION_UNIVERSAL_IDENTIFIER\s*=\s*'([0-9a-fA-F-]{36})'/,
    },
    {
      file: path.join(FRONT_MODULES_DIR, `smb-${key}/manifest.ts`),
      pattern: /applicationUniversalIdentifier:\s*'([0-9a-fA-F-]{36})'/,
    },
    { file: SERVER_MANIFEST_REGISTRY, pattern: null },
  ];

  for (const { file, pattern } of candidates) {
    if (!existsSync(file)) {
      continue;
    }

    const content = readFileSync(file, 'utf8');

    if (pattern) {
      const match = content.match(pattern);

      if (match) {
        return match[1];
      }

      continue;
    }

    const entry = content
      .split('}')
      .find((chunk) => chunk.includes(`key: '${key}'`));
    const match = entry?.match(
      /applicationUniversalIdentifier:\s*'([0-9a-fA-F-]{36})'/,
    );

    if (match) {
      return match[1];
    }
  }

  return null;
};

const connectPostgres = async () => {
  const connectionString =
    process.env.SMB_PG_URL ||
    readServerEnv().PG_DATABASE_URL ||
    process.env.PG_DATABASE_URL;

  if (!connectionString) {
    fail(
      'не найден URL базы: SMB_PG_URL в окружении или PG_DATABASE_URL в packages/twenty-server/.env',
    );
  }

  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString });

  await client.connect();

  return {
    client,
    close: async () => {
      await client.end();
    },
  };
};

const confirmDestructiveAction = async (question) => {
  const interface_ = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await interface_.question(question);

  interface_.close();

  return answer.trim();
};

const disableModule = async (key, options) => {
  const universalIdentifier = resolveModuleApplicationUuid(key);

  if (!universalIdentifier) {
    fail(
      `модуль '${key}' не найден: нет ни app/${key}/src/application-config.ts, ни манифеста фронта, ни строки в серверном реестре`,
    );
  }

  const { client, close } = await connectPostgres();

  try {
    const { rows: installedApplications } = await client.query(
      'SELECT id, "workspaceId", name, version, state ' +
        'FROM core.application ' +
        'WHERE "universalIdentifier" = $1 AND "deletedAt" IS NULL ' +
        'ORDER BY "createdAt"',
      [universalIdentifier],
    );
    const applications = options.workspace
      ? installedApplications.filter(
          (application) => application.workspaceId === options.workspace,
        )
      : installedApplications;

    if (applications.length === 0) {
      console.log(
        `App модуля '${key}' не установлен${
          options.workspace
            ? ` в компании ${options.workspace}`
            : ' ни в одной компании'
        } — снимать доступ нечего.`,
      );

      return;
    }

    const plan = [];

    for (const application of applications) {
      const { rows } = await client.query(
        'SELECT count(*)::int AS count FROM core."roleTarget" ' +
          'WHERE "applicationId" = $1 AND "workspaceId" = $2',
        [application.id, application.workspaceId],
      );

      plan.push({ application, assignments: rows[0].count });
    }

    console.log(`Модуль '${key}' (${universalIdentifier}):`);

    for (const { application, assignments } of plan) {
      console.log(
        `  - компания ${application.workspaceId}: App '${application.name}' v${application.version ?? 'null'} (${application.state}), назначений ролей ${assignments}`,
      );
    }

    if (options.dryRun) {
      console.log('dry-run: ничего не изменено.');

      return;
    }

    if (options.deleteData) {
      if (!options.workspace) {
        fail(
          '--delete-data работает на одну компанию: добавьте --workspace <uuid>',
        );
      }

      if (!options.yes) {
        if (!process.stdin.isTTY) {
          fail('--delete-data без терминала требует явного --yes');
        }

        const answer = await confirmDestructiveAction(
          `Удалить ДАННЫЕ модуля '${key}' из компании ${options.workspace}? Введите "удалить": `,
        );

        if (answer !== 'удалить') {
          console.log('Отменено: данные не тронуты.');

          return;
        }
      }

      await runMetadataGraphql({
        query:
          'mutation UninstallApplication($universalIdentifier: String!) {' +
          ' uninstallApplication(universalIdentifier: $universalIdentifier) }',
        variables: { universalIdentifier },
      });
      console.log(
        'uninstallApplication выполнен: данные модуля удалены штатным жизненным циклом Apps.',
      );

      return;
    }

    let revokedAssignments = 0;

    for (const { application } of plan) {
      const result = await client.query(
        'DELETE FROM core."roleTarget" ' +
          'WHERE "applicationId" = $1 AND "workspaceId" = $2',
        [application.id, application.workspaceId],
      );

      revokedAssignments += result.rowCount;
      console.log(
        `  - ${application.workspaceId}: снято назначений роли ${result.rowCount}`,
      );
    }

    console.log(
      `Готово: доступ снят (назначений роли удалено: ${revokedAssignments}), данные не тронуты.`,
    );
    console.log(
      `Удаление данных — отдельный шаг: yarn smb:module disable ${key} --workspace <uuid> --delete-data`,
    );
  } finally {
    await close();
  }
};

const newModule = (key, options) => {
  if (!KEY_PATTERN.test(key)) {
    fail(
      `ключ '${key}' должен быть kebab-case в пределах [a-z][a-z0-9-]{1,32}`,
    );
  }

  const displayName = options.displayName ?? key;
  const manifestConst = constName(key);
  const frontDir = path.join(FRONT_MODULES_DIR, `smb-${key}`);
  const appDir = path.join(APPS_DIR, key);
  const serverDir = path.join(SERVER_MODULES_DIR, `smb-${key}`);

  if (existsSync(frontDir)) {
    fail(`фронт-часть уже существует: ${relative(frontDir)}`);
  }
  if (existsSync(appDir)) {
    fail(`App уже существует: ${relative(appDir)}`);
  }
  if (options.server && existsSync(serverDir)) {
    fail(`серверная часть уже существует: ${relative(serverDir)}`);
  }

  const ids = {
    appUuid: randomUUID(),
    roleUuid: randomUUID(),
  };

  console.log(`Модуль '${key}':`);

  // app/
  writeFile(
    path.join(appDir, 'package.json'),
    appPackageJson({ key, displayName }),
  );
  writeFile(path.join(appDir, 'tsconfig.json'), appTsconfig());
  writeFile(path.join(appDir, '.oxlintrc.json'), appOxlintrc());
  writeFile(path.join(appDir, '.gitignore'), appGitignore());
  writeFile(path.join(appDir, '.yarnrc.yml'), 'nodeLinker: node-modules\n');
  writeFile(
    path.join(appDir, 'src/application-config.ts'),
    appApplicationConfig({ displayName, ...ids }),
  );
  writeFile(
    path.join(appDir, 'src/roles/default-role.ts'),
    appDefaultRole({ key, ...ids }),
  );
  writeFile(
    path.join(appDir, 'README.md'),
    appReadme({ key, displayName, appUuid: ids.appUuid }),
  );
  ensurePatchRow(
    APP_PATCH_PATH,
    'App модулей форка: каталог создаёт генератор `yarn smb:module new` (M-5)',
  );

  // front/
  writeFile(
    path.join(frontDir, 'manifest.ts'),
    frontManifest({ key, displayName, manifestConst, appUuid: ids.appUuid }),
  );
  writeFile(
    path.join(frontDir, 'pages', `${pascalCase(key)}Page.tsx`),
    frontPage({ key, displayName }),
  );

  insertAfterMarker(
    FRONT_REGISTRY,
    IMPORTS_MARKER,
    `import { ${manifestConst} } from '@/smb-${key}/manifest';`,
  );
  insertAfterMarker(FRONT_REGISTRY, LIST_MARKER, `  ${manifestConst},`);

  // Серверный реестр манифестов: строка нужна и без флага --server — по ней
  // guard находит App модуля, а сверка версии при старте читает expectedVersion
  // (M-4/M-7). Исходник версии один: APP_VERSION, он же пишется в package.json.
  if (existsSync(SERVER_MANIFEST_REGISTRY)) {
    insertAfterMarker(
      SERVER_MANIFEST_REGISTRY,
      MANIFEST_MARKER,
      `  { key: '${key}', applicationUniversalIdentifier: '${ids.appUuid}', expectedVersion: '${APP_VERSION}' },`,
    );
  } else {
    console.log(
      `  ! ${relative(SERVER_MANIFEST_REGISTRY)} не найден — строка манифеста не вставлена`,
    );
  }

  // server/ (по флагу)
  if (options.server) {
    if (!existsSync(SERVER_MODULES_DIR)) {
      fail('каталог packages/twenty-server/src/modules не найден');
    }

    writeFile(path.join(serverDir, `${key}.module.ts`), serverModule({ key }));
    writeFile(
      path.join(serverDir, 'migrations', `smb-${key}.migrations.ts`),
      serverMigrations({ key }),
    );

    if (existsSync(SERVER_MIGRATIONS_REGISTRY)) {
      insertAfterMarker(
        SERVER_MIGRATIONS_REGISTRY,
        MIGRATIONS_IMPORTS_MARKER,
        `import { ${migrationsConstName(key)} } from 'src/modules/smb-${key}/migrations/smb-${key}.migrations';`,
      );
      insertAfterMarker(
        SERVER_MIGRATIONS_REGISTRY,
        MIGRATIONS_MARKER,
        `  ...${migrationsConstName(key)},`,
      );
    } else {
      console.log(
        `  ! ${relative(SERVER_MIGRATIONS_REGISTRY)} не найден — миграции модуля не подключены`,
      );
    }

    if (existsSync(SERVER_REGISTRY)) {
      insertAfterMarker(
        SERVER_REGISTRY,
        IMPORTS_MARKER,
        `import { Smb${pascalCase(key)}Module } from './smb-${key}/${key}.module';`,
      );
      insertAfterMarker(
        SERVER_REGISTRY,
        LIST_MARKER,
        `    Smb${pascalCase(key)}Module,`,
      );
    } else {
      console.log(
        `  ! ${relative(SERVER_REGISTRY)} не существует (шов P-002 открыт, M-1): ` +
          'строка в серверный реестр не вставлена',
      );
    }

    ensurePatchRow(
      SERVER_PATCH_PATH,
      'серверная часть модулей: каталог создаёт генератор `yarn smb:module new --server`',
    );
  }

  console.log('');
  console.log('Дальше (см. docs/dev/module-authoring.md):');
  console.log(`  1. пропишите объекты/поля App в ${relative(appDir)}/src`);
  console.log(`  2. наполните страницу ${relative(frontDir)}/pages`);
  if (!options.server) {
    console.log(
      '  3. при необходимости серверную часть добавьте флагом --server',
    );
  }
};

const main = () => {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [command, key] = positional;

  if (command === 'new') {
    if (!key) {
      fail('укажите ключ: yarn smb:module new <key>');
    }

    newModule(key, options);
    return;
  }

  if (command === 'list') {
    listModules();
    return;
  }

  if (command === 'disable') {
    if (!key) {
      fail('укажите ключ: yarn smb:module disable <key>');
    }

    disableModule(key, options).catch((error) =>
      fail(error instanceof Error ? error.message : String(error)),
    );
    return;
  }

  console.log(
    'Использование:\n' +
      '  yarn smb:module new <key> [--display-name "Название"] [--server]\n' +
      '  yarn smb:module list\n' +
      '  yarn smb:module disable <key> [--workspace <uuid>] [--dry-run] ' +
      '[--delete-data --yes]',
  );
  process.exit(positional.length === 0 ? 0 : 1);
};

main();
