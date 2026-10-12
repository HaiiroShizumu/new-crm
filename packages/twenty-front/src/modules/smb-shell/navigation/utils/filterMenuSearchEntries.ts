import Fuse from 'fuse.js';

import { normalizeSearchText } from '~/utils/normalizeSearchText';

export const filterMenuSearchEntries = <TEntry extends { label: string }>({
  entries,
  searchQuery,
}: {
  entries: TEntry[];
  searchQuery: string;
}): TEntry[] => {
  const trimmedQuery = searchQuery.trim();

  if (trimmedQuery.length === 0) {
    return entries;
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const fuse = new Fuse(entries, {
    keys: ['label'],
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    getFn: (entry, path) => {
      const value = Fuse.config.getFn(entry, path);

      return typeof value === 'string' ? normalizeSearchText(value) : value;
    },
  });

  return fuse
    .search(normalizedQuery)
    .map((result) => ({
      entry: result.item,
      score: result.score ?? 1,
      isPrefix: normalizeSearchText(result.item.label).startsWith(
        normalizedQuery,
      ),
    }))
    .sort((left, right) => {
      if (left.isPrefix !== right.isPrefix) {
        return left.isPrefix ? -1 : 1;
      }

      return left.score - right.score;
    })
    .map(({ entry }) => entry);
};
