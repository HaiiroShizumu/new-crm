import { type NavigationMenuItemType } from 'twenty-shared/types';

export type PersonalWorkspaceNavItem = {
  id: string;
  type: NavigationMenuItemType;
  position: number;
  folderId?: string | null;
  targetObjectMetadataId?: string | null;
  targetRecordId?: string | null;
  viewId?: string | null;
  pageLayoutId?: string | null;
  name?: string | null;
  link?: string | null;
  icon?: string | null;
  color?: string | null;
};

export const isPersonalWorkspaceNavItemArray = (
  value: unknown,
): value is PersonalWorkspaceNavItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as PersonalWorkspaceNavItem).id === 'string' &&
      typeof (item as PersonalWorkspaceNavItem).type === 'string' &&
      typeof (item as PersonalWorkspaceNavItem).position === 'number',
  );
