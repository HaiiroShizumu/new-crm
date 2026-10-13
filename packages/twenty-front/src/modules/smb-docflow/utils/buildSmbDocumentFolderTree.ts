import { type SmbDocumentFolder } from '@/smb-docflow/types/SmbDocumentFolder';
import { type SmbDocumentFolderNode } from '@/smb-docflow/types/SmbDocumentFolderNode';
import { isDefined } from 'twenty-shared/utils';

// The parent link is plain data anyone with access can edit, so it may point
// at a deleted folder or form a loop. A folder whose chain of parents never
// reaches the top is shown at the top instead of disappearing or hanging the page.
const reachesRoot = (
  folder: SmbDocumentFolder,
  foldersById: Map<string, SmbDocumentFolder>,
): boolean => {
  const visitedIds = new Set<string>([folder.id]);
  let parentId = folder.parentFolderId;

  while (isDefined(parentId)) {
    const parent = foldersById.get(parentId);

    if (!isDefined(parent) || visitedIds.has(parent.id)) {
      return false;
    }

    visitedIds.add(parent.id);
    parentId = parent.parentFolderId;
  }

  return true;
};

export const buildSmbDocumentFolderTree = (
  folders: SmbDocumentFolder[],
): SmbDocumentFolderNode[] => {
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));

  const rootIds = new Set(
    folders
      .filter(
        (folder) =>
          !isDefined(folder.parentFolderId) ||
          !reachesRoot(folder, foldersById),
      )
      .map((folder) => folder.id),
  );

  const buildNode = (folder: SmbDocumentFolder): SmbDocumentFolderNode => ({
    folder,
    children: folders
      .filter(
        (candidate) =>
          candidate.parentFolderId === folder.id && !rootIds.has(candidate.id),
      )
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(buildNode),
  });

  return folders
    .filter((folder) => rootIds.has(folder.id))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(buildNode);
};
