import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const MODULES_DIRECTORY = join(__dirname, '..', '..');

// ADR-013 п.1–2: instance-команда форка на обновлённом сервере не выполнится
// (курсор конвейера), а @MetadataResolver уводит резолвер в metadata-схему,
// которую форк не расширяет.
const FORBIDDEN_DECORATORS = [
  '@RegisteredInstanceCommand',
  '@MetadataResolver',
];

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return entry === '__tests__' || entry === 'node_modules'
        ? []
        : collectSourceFiles(path);
    }

    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('серверные модули форка (ADR-013 п.1–2)', () => {
  const smbDirectories = readdirSync(MODULES_DIRECTORY)
    .filter((entry) => /^smb-[a-z0-9-]+$/.test(entry))
    .map((entry) => join(MODULES_DIRECTORY, entry))
    .filter((path) => statSync(path).isDirectory());

  it('находит каталоги smb-*', () => {
    expect(smbDirectories.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN_DECORATORS)('не использует %s', (decorator) => {
    const offenders = smbDirectories
      .flatMap(collectSourceFiles)
      .filter((file) =>
        stripComments(readFileSync(file, 'utf8')).includes(decorator),
      )
      .map((file) => relative(MODULES_DIRECTORY, file));

    expect(offenders).toEqual([]);
  });
});
