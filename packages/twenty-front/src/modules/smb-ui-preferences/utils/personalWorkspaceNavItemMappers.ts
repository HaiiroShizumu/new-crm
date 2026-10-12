import {
  type NavigationMenuItem,
  type NavigationMenuItemType as GeneratedNavigationMenuItemType,
} from '~/generated-metadata/graphql';

import { type PersonalWorkspaceNavItem } from '@/smb-ui-preferences/types/PersonalWorkspaceNavItem';

// v2.45.6: `NavigationMenuItemType` объявлен дважды — в кодогенерированном
// `~/generated-metadata/graphql` и в `twenty-shared/types`. Это два разных
// enum-типа (проверено tsc: присваивание между ними — TS2322, обычный `as` —
// TS2352), наборы членов при этом идентичны, поэтому конверсия через `unknown`.
export const toPersonalWorkspaceNavItems = (
  items: NavigationMenuItem[],
): PersonalWorkspaceNavItem[] =>
  items.map((item) => ({
    id: item.id,
    type: item.type as unknown as PersonalWorkspaceNavItem['type'],
    position: item.position,
    folderId: item.folderId,
    targetObjectMetadataId: item.targetObjectMetadataId,
    targetRecordId: item.targetRecordId,
    viewId: item.viewId,
    pageLayoutId: item.pageLayoutId,
    name: item.name,
    link: item.link,
    icon: item.icon,
    color: item.color,
  }));

export const fromPersonalWorkspaceNavItems = (
  items: PersonalWorkspaceNavItem[],
): NavigationMenuItem[] =>
  items.map((item) => ({
    __typename: 'NavigationMenuItem',
    id: item.id,
    type: item.type as unknown as GeneratedNavigationMenuItemType,
    position: item.position,
    userWorkspaceId: null,
    folderId: item.folderId ?? undefined,
    targetObjectMetadataId: item.targetObjectMetadataId ?? undefined,
    targetRecordId: item.targetRecordId ?? undefined,
    viewId: item.viewId ?? undefined,
    pageLayoutId: item.pageLayoutId ?? undefined,
    name: item.name ?? undefined,
    link: item.link ?? undefined,
    icon: item.icon ?? undefined,
    color: item.color ?? undefined,
    applicationId: undefined,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }));
