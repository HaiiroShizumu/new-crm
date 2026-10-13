import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { NavigationMenuItemType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconSearch } from 'twenty-ui/icon';

import { lastClickedNavigationMenuItemIdState } from '@/navigation-menu-item/common/states/lastClickedNavigationMenuItemIdState';
import { NavigationMenuItemIcon } from '@/navigation-menu-item/display/components/NavigationMenuItemIcon';
import { useIdentifyActiveNavigationMenuItems } from '@/navigation-menu-item/display/hooks/useIdentifyActiveNavigationMenuItems';
import { useNavigationMenuItemsData } from '@/navigation-menu-item/display/hooks/useNavigationMenuItemsData';
import { getNavigationMenuItemComputedLink } from '@/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink';
import { getNavigationMenuItemLabel } from '@/navigation-menu-item/display/utils/getNavigationMenuItemLabel';
import {
  NavigationPillTabsShell,
  StyledNavigationPillTab,
} from '@/smb-shell/navigation/components/NavigationPillTabsShell';
import { lastVisitedViewPerObjectMetadataItemState } from '@/smb-shell/navigation/states/lastVisitedViewPerObjectMetadataItemState';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

type TopWorkspaceNavigationTabsProps = {
  onSearchClick?: () => void;
  showSearchTab?: boolean;
};

export const TopWorkspaceNavigationTabs = ({
  onSearchClick,
  showSearchTab = false,
}: TopWorkspaceNavigationTabsProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { workspaceNavigationMenuItems } = useNavigationMenuItemsData();
  const { objectMetadataItems } = useFilteredObjectMetadataItems();
  const views = useAtomStateValue(viewsSelector);
  const lastVisitedViewPerObjectMetadataItem = useAtomStateValue(
    lastVisitedViewPerObjectMetadataItemState,
  );
  const isInitialObjectViewEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_INITIAL_OBJECT_VIEW_ENABLED,
  );
  const { activeNavigationMenuItemIds } =
    useIdentifyActiveNavigationMenuItems();
  const setLastClickedNavigationMenuItemId = useSetAtomState(
    lastClickedNavigationMenuItemIdState,
  );
  const tabs = workspaceNavigationMenuItems.filter(
    (item) =>
      item.type !== NavigationMenuItemType.FOLDER && !isDefined(item.folderId),
  );

  if (tabs.length === 0 && !showSearchTab) {
    return null;
  }

  return (
    <NavigationPillTabsShell aria-label={t`Workspace navigation`}>
      {tabs.map((item) => {
        const label = getNavigationMenuItemLabel(
          item,
          objectMetadataItems,
          views,
        );
        const isActive = activeNavigationMenuItemIds.includes(item.id);

        return (
          <StyledNavigationPillTab
            key={item.id}
            type="button"
            aria-current={isActive}
            onClick={() => {
              const link = getNavigationMenuItemComputedLink({
                item,
                objectMetadataItems,
                views,
                lastVisitedViewPerObjectMetadataItem,
                isInitialObjectViewEnabled,
              });

              if (!isDefined(link) || link.length === 0) {
                return;
              }

              setLastClickedNavigationMenuItemId(item.id);
              navigate(link);
            }}
          >
            <NavigationMenuItemIcon navigationMenuItem={item} />
            {label}
          </StyledNavigationPillTab>
        );
      })}
      {showSearchTab && onSearchClick && (
        <StyledNavigationPillTab type="button" onClick={onSearchClick}>
          <IconSearch size={24} />
          {t`Search`}
        </StyledNavigationPillTab>
      )}
    </NavigationPillTabsShell>
  );
};
