import assert from 'node:assert/strict';
import test from 'node:test';

import { orderModulesByDependsOn } from '../smb-preset.mjs';

const buildRegistry = (entries) =>
  new Map(entries.map((entry) => [entry.key, entry]));

test('пресет ставит зависимости первыми', () => {
  const modulesByKey = buildRegistry([
    { key: 'tasks', dependsOn: ['org-structure'] },
    { key: 'org-structure', dependsOn: [] },
    { key: 'absences', dependsOn: ['org-structure', 'tasks'] },
  ]);

  assert.deepEqual(orderModulesByDependsOn(['absences'], modulesByKey), [
    'org-structure',
    'tasks',
    'absences',
  ]);
});

test('зависимость вне пресета подтягивается автоматически', () => {
  const modulesByKey = buildRegistry([
    { key: 'tasks', dependsOn: ['org-structure'] },
    { key: 'org-structure', dependsOn: [] },
  ]);

  assert.deepEqual(orderModulesByDependsOn(['tasks'], modulesByKey), [
    'org-structure',
    'tasks',
  ]);
});

test('порядок заданных вручную ключей сохраняется', () => {
  const modulesByKey = buildRegistry([
    { key: 'feed', dependsOn: [] },
    { key: 'documents', dependsOn: [] },
  ]);

  assert.deepEqual(
    orderModulesByDependsOn(['feed', 'documents'], modulesByKey),
    ['feed', 'documents'],
  );
});

test('цикл dependsOn — ошибка, а не зависший скрипт', () => {
  const modulesByKey = buildRegistry([
    { key: 'a', dependsOn: ['b'] },
    { key: 'b', dependsOn: ['a'] },
  ]);

  assert.throws(() => orderModulesByDependsOn(['a'], modulesByKey), /цикл/);
});

test('неизвестный модуль — ошибка с его ключом', () => {
  assert.throws(
    () => orderModulesByDependsOn(['ghost'], buildRegistry([])),
    /'ghost' не найден/,
  );
});
