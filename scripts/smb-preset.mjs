#!/usr/bin/env node
/**
 * Пресеты модулей форка (M-6, ADR-006 / ADR-009 п.3).
 *
 *   yarn smb:preset list [--json]
 *   yarn smb:preset install <preset> [--workspace <uuid>] [--dry-run]
 *
 * Пресет — curated-список ключей модулей (`packages/twenty-apps/smb/presets.json`).
 * Установка пресета = установка их App одной командой в порядке `dependsOn`
 * (порядок берётся из манифестов фронта). Состояние «что включено» не хранится
 * здесь отдельным реестром — его показывают строки `core.application` (ADR-006).
 *
 * Установка идёт штатной мутацией `installApplication` мета-API (нужен
 * SMB_API_TOKEN с правом APPLICATIONS). `--dry-run` печатает план и ничего
 * не отправляет.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runMetadataGraphql } from './lib/smb-api.mjs';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const PRESETS_FILE = path.join(
  REPO_ROOT,
  'packages/twenty-apps/smb/presets.json',
);
const FRONT_MODULES_DIR = path.join(
  REPO_ROOT,
  'packages/twenty-front/src/modules',
);

const fail = (message) => {
  console.error(`smb:preset: ${message}`);
  process.exit(1);
};

const INSTALL_APPLICATION_MUTATION = `mutation InstallApplication($universalIdentifier: String!) {
  installApplication(universalIdentifier: $universalIdentifier) {
    id
    name
    version
  }
}`;

// Пресеты читаются из файла, а не из кода: наборы — данные, их меняет владелец.
export const loadPresets = (presetsFile = PRESETS_FILE) => {
  if (!existsSync(presetsFile)) {
    throw new Error(`не найден файл пресетов ${presetsFile}`);
  }

  const payload = JSON.parse(readFileSync(presetsFile, 'utf8'));
  const presets = payload.presets ?? [];

  if (!Array.isArray(presets)) {
    throw new Error(`${presetsFile}: ожидается массив в поле "presets"`);
  }

  return presets;
};

// Манифесты фронта — единственный источник dependsOn: там же лежит uuid App,
// по которому решается, включён ли модуль (ADR-009 п.3).
export const discoverModules = (frontModulesDir = FRONT_MODULES_DIR) => {
  if (!existsSync(frontModulesDir)) {
    return [];
  }

  const modules = [];

  for (const entry of readdirSync(frontModulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('smb-')) {
      continue;
    }

    const manifestFile = path.join(frontModulesDir, entry.name, 'manifest.ts');

    if (!existsSync(manifestFile)) {
      continue;
    }

    const content = readFileSync(manifestFile, 'utf8');
    const dependsOnBody =
      content.match(/dependsOn:\s*\[([^\]]*)\]/s)?.[1] ?? '';

    modules.push({
      key: content.match(/key:\s*'([^']+)'/)?.[1] ?? entry.name.slice(4),
      applicationUniversalIdentifier:
        content.match(/applicationUniversalIdentifier:\s*'([^']+)'/)?.[1] ??
        null,
      dependsOn: [...dependsOnBody.matchAll(/'([^']+)'/g)].map(
        (match) => match[1],
      ),
    });
  }

  return modules;
};

// Топологическая сортировка: сначала dependsOn, затем остальные.
// Зависимости, которых нет в пресете, подтягиваются сами; неизвестный ключ или
// цикл — ошибка, а не тихая установка в неверном порядке.
export const orderModulesByDependsOn = (presetKeys, modulesByKey) => {
  const ordered = [];
  const visited = new Set();

  const visit = (key, chain) => {
    if (visited.has(key)) {
      return;
    }

    if (chain.has(key)) {
      throw new Error(`цикл dependsOn: ${[...chain, key].join(' -> ')}`);
    }

    const module = modulesByKey.get(key);

    if (!module) {
      throw new Error(
        `модуль '${key}' не найден в манифестах фронта (packages/twenty-front/src/modules/smb-*/manifest.ts)`,
      );
    }

    chain.add(key);

    for (const dependency of module.dependsOn) {
      visit(dependency, chain);
    }

    chain.delete(key);
    visited.add(key);
    ordered.push(key);
  };

  for (const key of presetKeys) {
    visit(key, new Set());
  }

  return ordered;
};

const resolveInstallOrder = (preset, modules) => {
  const modulesByKey = new Map(modules.map((module) => [module.key, module]));

  return orderModulesByDependsOn(preset.modules ?? [], modulesByKey).map(
    (key) => modulesByKey.get(key),
  );
};

const listPresets = ({ json }) => {
  const presets = loadPresets();
  const modules = discoverModules();

  if (json) {
    console.log(JSON.stringify({ presets, modules }, null, 2));

    return;
  }

  console.log(`Пресеты (${presets.length}):`);

  for (const preset of presets) {
    console.log(`  - ${preset.key}: ${(preset.modules ?? []).join(', ')}`);
  }

  if (presets.length === 0) {
    console.log('  (нет — файл packages/twenty-apps/smb/presets.json пуст)');
  }

  console.log(`Зарегистрированные модули (${modules.length}):`);

  for (const module of modules) {
    console.log(
      `  - ${module.key}  app=${module.applicationUniversalIdentifier ?? '?'}  dependsOn=[${module.dependsOn.join(', ')}]`,
    );
  }

  if (modules.length === 0) {
    console.log('  (нет: yarn smb:module new <key>)');
  }
};

const installPreset = async (presetKey, options) => {
  const presets = loadPresets();
  const preset = presets.find((candidate) => candidate.key === presetKey);

  if (!preset) {
    fail(
      `пресет '${presetKey}' не найден; доступны: ${
        presets.map((candidate) => candidate.key).join(', ') || '(нет)'
      }`,
    );
  }

  const modules = discoverModules();
  const installOrder = resolveInstallOrder(preset, modules);

  console.log(`Пресет '${preset.key}' — установка в порядке dependsOn:`);

  installOrder.forEach((module, index) => {
    console.log(
      `  ${index + 1}. ${module.key}  app=${module.applicationUniversalIdentifier ?? '?'}`,
    );
  });

  if (options.dryRun) {
    console.log('dry-run: запросы к API не отправлялись.');

    return;
  }

  for (const module of installOrder) {
    if (!module.applicationUniversalIdentifier) {
      fail(`у модуля '${module.key}' нет uuid App в манифесте`);
    }

    const data = await runMetadataGraphql({
      query: INSTALL_APPLICATION_MUTATION,
      variables: {
        universalIdentifier: module.applicationUniversalIdentifier,
      },
    });

    console.log(
      `  + ${module.key}: установлен (v${data.installApplication.version ?? '?'})`,
    );
  }

  if (options.workspace) {
    console.log(
      `Готово: пресет '${preset.key}' установлен в компании ${options.workspace}.`,
    );
  } else {
    console.log(
      `Готово: пресет '${preset.key}' установлен в компании из токена (SMB_API_TOKEN).`,
    );
  }
};

const parseArgs = (argv) => {
  const options = { workspace: undefined, dryRun: false, json: false };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (argument === '--json') {
      options.json = true;
      continue;
    }

    if (argument === '--workspace') {
      options.workspace = argv[index + 1];
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

const main = async () => {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [command, presetKey] = positional;

  if (command === 'list') {
    listPresets(options);

    return;
  }

  if (command === 'install') {
    if (!presetKey) {
      fail('укажите пресет: yarn smb:preset install <preset>');
    }

    await installPreset(presetKey, options);
    return;
  }

  console.log(
    'Использование:\n' +
      '  yarn smb:preset list [--json]\n' +
      '  yarn smb:preset install <preset> [--dry-run] [--workspace <uuid>]',
  );
  process.exit(positional.length === 0 ? 0 : 1);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) =>
    fail(error instanceof Error ? error.message : String(error)),
  );
}
