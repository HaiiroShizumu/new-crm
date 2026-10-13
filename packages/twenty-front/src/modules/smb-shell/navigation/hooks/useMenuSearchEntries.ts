import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useMemo } from 'react';
import {
  AppPath,
  NavigationMenuItemType,
  SettingsPath,
} from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { IconSettings, useIcons } from 'twenty-ui/icon';

import { isNavigationMenuItemFolder } from '@/navigation-menu-item/common/utils/isNavigationMenuItemFolder';
import { useNavigationMenuItemsByFolder } from '@/navigation-menu-item/display/folder/hooks/useNavigationMenuItemsByFolder';
import { useNavigationMenuItemSectionItems } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemSectionItems';
import { useSortedNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useSortedNavigationMenuItems';
import { getNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink';
import { getNavigationMenuItemLabel } from '@/navigation-menu-item/display/utils/getNavigationMenuItemLabel';
import { useNavigationDrawerModes } from '@/smb-shell/navigation/hooks/useNavigationDrawerModes';
import { lastVisitedViewPerObjectMetadataItemState } from '@/smb-shell/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { type MenuSearchEntry } from '@/smb-shell/navigation/types/MenuSearchEntry';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import {
  type SettingsNavigationItem,
  useSettingsNavigationItems,
} from '@/settings/hooks/useSettingsNavigationItems';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import {
  FeatureFlagKey,
  type NavigationMenuItem,
} from '~/generated-metadata/graphql';

const flattenSettingsNavigationItems = (
  items: SettingsNavigationItem[],
): SettingsNavigationItem[] => {
  return items.flatMap((item) => [
    item,
    ...(isDefined(item.subItems)
      ? flattenSettingsNavigationItems(item.subItems)
      : []),
  ]);
};

export const useMenuSearchEntries = (): MenuSearchEntry[] => {
  const { t } = useLingui();
  const { getIcon } = useIcons();
  const modes = useNavigationDrawerModes();
  const workspaceItems = useNavigationMenuItemSectionItems();
  const { navigationMenuItemsSorted } = useSortedNavigationMenuItems();
  const { userNavigationMenuItemsByFolder } = useNavigationMenuItemsByFolder();
  const settingsSections = useSettingsNavigationItems();
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const isInitialObjectViewEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_INITIAL_OBJECT_VIEW_ENABLED,
  );
  const settingsModeLabel = t`Settings`;

  return useMemo(() => {
    const entriesByPath = new Map<string, MenuSearchEntry>();

    const addEntry = (entry: MenuSearchEntry) => {
      if (!isNonEmptyString(entry.path) || !isNonEmptyString(entry.label)) {
        return;
      }

      if (entriesByPath.has(entry.path)) {
        return;
      }

      entriesByPath.set(entry.path, entry);
    };

    for (const mode of modes) {
      let path = '';

      switch (mode.mode) {
        case NAVIGATION_DRAWER_TABS.NAVIGATION_MENU:
          path = AppPath.Index;
          break;
        default:
          break;
      }

      addEntry({
        id: `mode-${mode.mode}`,
        label: mode.label,
        path,
        Icon: mode.Icon,
        section: 'mode',
        mode: mode.mode,
      });
    }

    addEntry({
      id: `mode-${NAVIGATION_DRAWER_TABS.SETTINGS}`,
      label: settingsModeLabel,
      path: getSettingsPath(SettingsPath.ProfilePage),
      Icon: IconSettings,
      section: 'mode',
      mode: NAVIGATION_DRAWER_TABS.SETTINGS,
    });

    const favoriteItems = [
      ...navigationMenuItemsSorted.filter(
        (item) =>
          !isDefined(item.folderId) && !isNavigationMenuItemFolder(item),
      ),
      ...userNavigationMenuItemsByFolder.flatMap(
        (folder) => folder.navigationMenuItems,
      ),
    ];

    const menuItems: NavigationMenuItem[] = [
      ...favoriteItems,
      ...workspaceItems.filter(
        (item) => item.type !== NavigationMenuItemType.FOLDER,
      ),
    ];

    for (const item of menuItems) {
      if (isNavigationMenuItemFolder(item)) {
        continue;
      }

      const label = getNavigationMenuItemLabel(
        item,
        objectMetadataItems,
        views,
      );
      const path = getNavigationMenuItemComputedLink({
        item,
        objectMetadataItems,
        views,
        lastVisitedViewPerObjectMetadataItem,
        isInitialObjectViewEnabled,
      });

      addEntry({
        id: `menu-${item.id}`,
        label,
        path,
        Icon: getIcon(item.icon),
        section: 'menu',
      });
    }

    const settingsItems = settingsSections.flatMap((section) =>
      flattenSettingsNavigationItems(section.items),
    );

    for (const item of settingsItems) {
      if (item.isHidden === true || !isDefined(item.path)) {
        continue;
      }

      addEntry({
        id: `settings-${item.path}`,
        label: item.label,
        path: getSettingsPath(item.path),
        Icon: item.Icon,
        section: 'settings',
      });
    }

    return Array.from(entriesByPath.values());
  }, [
    getIcon,
    isInitialObjectViewEnabled,
    lastVisitedViewPerObjectMetadataItem,
    modes,
    navigationMenuItemsSorted,
    objectMetadataItems,
    settingsModeLabel,
    settingsSections,
    userNavigationMenuItemsByFolder,
    views,
    workspaceItems,
  ]);
};
