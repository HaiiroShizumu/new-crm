import { type SmbDocumentFolder } from '@/smb-docflow/types/SmbDocumentFolder';
import { type SmbDocumentFolderNode } from '@/smb-docflow/types/SmbDocumentFolderNode';
import { buildSmbDocumentFolderTree } from '@/smb-docflow/utils/buildSmbDocumentFolderTree';

const buildFolder = (
  id: string,
  parentFolderId: string | null = null,
): SmbDocumentFolder => ({
  __typename: 'SmbDocumentFolder',
  id,
  name: id,
  color: 'GRAY',
  parentFolderId,
});

const toShape = (nodes: SmbDocumentFolderNode[]): unknown =>
  nodes.map(({ folder, children }) => ({ [folder.id]: toShape(children) }));

describe('buildSmbDocumentFolderTree', () => {
  it('returns an empty tree for no folders', () => {
    expect(buildSmbDocumentFolderTree([])).toEqual([]);
  });

  it('nests folders three levels deep and sorts siblings by name', () => {
    const tree = buildSmbDocumentFolderTree([
      buildFolder('contracts-2026', 'contracts'),
      buildFolder('hr'),
      buildFolder('contracts'),
      buildFolder('contracts-2026-q1', 'contracts-2026'),
      buildFolder('contracts-2025', 'contracts'),
    ]);

    expect(toShape(tree)).toEqual([
      {
        contracts: [
          { 'contracts-2025': [] },
          { 'contracts-2026': [{ 'contracts-2026-q1': [] }] },
        ],
      },
      { hr: [] },
    ]);
  });

  it('shows a folder at the top when its parent does not exist', () => {
    const tree = buildSmbDocumentFolderTree([
      buildFolder('orphan', 'deleted-folder'),
      buildFolder('orphan-child', 'orphan'),
    ]);

    expect(toShape(tree)).toEqual([{ orphan: [] }, { 'orphan-child': [] }]);
  });

  it('shows both folders of a loop at the top', () => {
    const tree = buildSmbDocumentFolderTree([
      buildFolder('a', 'b'),
      buildFolder('b', 'a'),
      buildFolder('c'),
    ]);

    expect(toShape(tree)).toEqual([{ a: [] }, { b: [] }, { c: [] }]);
  });

  it('shows a folder that is its own parent at the top', () => {
    expect(
      toShape(buildSmbDocumentFolderTree([buildFolder('self', 'self')])),
    ).toEqual([{ self: [] }]);
  });

  it('keeps every folder exactly once', () => {
    const folders = [
      buildFolder('a', 'b'),
      buildFolder('b', 'a'),
      buildFolder('root'),
      buildFolder('child', 'root'),
      buildFolder('below-loop', 'a'),
    ];
    const countNodes = (nodes: SmbDocumentFolderNode[]): number =>
      nodes.reduce((sum, node) => sum + 1 + countNodes(node.children), 0);

    expect(countNodes(buildSmbDocumentFolderTree(folders))).toBe(
      folders.length,
    );
  });
});
