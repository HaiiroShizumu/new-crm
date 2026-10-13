import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { IconChevronDown, IconList, useIcons } from 'twenty-ui/icon';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { useContextStoreObjectMetadataItemOrThrow } from '@/context-store/hooks/useContextStoreObjectMetadataItemOrThrow';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { SMB_VIEW_TABS_MAX_COUNT } from '@/smb-shell/view-bar/constants/SmbViewTabsMaxCount';
import { pickSmbViewTabs } from '@/smb-shell/view-bar/utils/pickSmbViewTabs';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { useGetRecordIndexTotalCount } from '@/views/hooks/internal/useGetRecordIndexTotalCount';
import { useChangeView } from '@/views/hooks/useChangeView';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { ViewPickerContentCreateMode } from '@/views/view-picker/components/ViewPickerContentCreateMode';
import { ViewPickerContentEditMode } from '@/views/view-picker/components/ViewPickerContentEditMode';
import { ViewPickerContentEffect } from '@/views/view-picker/components/ViewPickerContentEffect';
import { ViewPickerListContent } from '@/views/view-picker/components/ViewPickerListContent';
import { useUpdateViewFromCurrentState } from '@/views/view-picker/hooks/useUpdateViewFromCurrentState';
import { useViewPickerMode } from '@/views/view-picker/hooks/useViewPickerMode';
import { computeViewPickerVisibleViews } from '@/views/view-picker/utils/computeViewPickerVisibleViews';
import { getViewPickerDropdownId } from '@/views/view-picker/utils/getViewPickerDropdownId';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

const StyledSwitcher = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['0.5']};
  min-width: 0;
`;

const StyledTab = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: var(
    --smb-control-radius,
    ${themeCssVariables.border.radius.sm}
  );
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  flex-shrink: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: var(--smb-control-height, 28px);
  max-width: 180px;
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.primary};
  }

  &[aria-selected='true'] {
    background: ${themeCssVariables.background.tertiary};
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: -2px;
  }
`;

const StyledTabIcon = styled.span`
  display: flex;
  flex-shrink: 0;
`;

const StyledTabCount = styled.span`
  color: ${themeCssVariables.font.color.light};
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledMoreButton = styled.div`
  align-items: center;
  border-radius: var(
    --smb-control-radius,
    ${themeCssVariables.border.radius.sm}
  );
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing['0.5']};
  height: var(--smb-control-height, 28px);
  justify-content: center;
  min-width: var(--smb-control-height, 28px);
  padding: 0 ${themeCssVariables.spacing[1]};
  user-select: none;

  &:hover,
  &[data-open='true'] {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.primary};
  }
`;

// Replaces the stock view picker button in the view bar (P-026): views are
// one click away as tabs, and the stock picker contents (reorder, edit, add
// view) stay reachable from the trailing button under the same dropdown id,
// so upstream hooks that open the picker keep working.
export const SmbViewSwitcher = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const { getIcon } = useIcons();
  const { formatNumber } = useNumberFormat();

  const { objectMetadataItem } = useContextStoreObjectMetadataItemOrThrow();
  const { recordIndexId } = useRecordIndexContextOrThrow();
  const { currentView } = useGetCurrentViewOnly();
  const { totalCount } = useGetRecordIndexTotalCount();
  const { changeView } = useChangeView();
  const { updateViewFromCurrentState } = useUpdateViewFromCurrentState();
  const { viewPickerMode, setViewPickerMode } = useViewPickerMode();

  const viewsOnCurrentObject = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );
  const isInitialObjectViewEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_INITIAL_OBJECT_VIEW_ENABLED,
  );

  const dropdownId = getViewPickerDropdownId(recordIndexId);
  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    dropdownId,
  );

  const visibleViews = computeViewPickerVisibleViews({
    views: viewsOnCurrentObject,
    currentViewId: currentView?.id,
    isInitialObjectViewEnabled,
  });
  const viewTabs = pickSmbViewTabs({
    views: visibleViews,
    currentViewId: currentView?.id,
    maxCount: SMB_VIEW_TABS_MAX_COUNT,
  });
  const hiddenViewCount = visibleViews.length - viewTabs.length;

  const handleClickOutside = async () => {
    if (isDropdownOpen && viewPickerMode === 'edit') {
      await updateViewFromCurrentState();
    }

    setViewPickerMode('list');
  };

  return (
    <StyledSwitcher role="tablist" aria-label={t`Views`} data-smb-view-switcher>
      {viewTabs.map((view) => {
        const isCurrentView = view.id === currentView?.id;
        const ViewIcon = getIcon(view.icon) ?? IconList;

        return (
          <StyledTab
            key={view.id}
            type="button"
            role="tab"
            aria-selected={isCurrentView}
            onClick={() => changeView(view.id)}
          >
            <StyledTabIcon>
              <ViewIcon size={theme.icon.size.md} />
            </StyledTabIcon>
            <OverflowingTextWithTooltip text={view.name} />
            {isCurrentView && isDefined(totalCount) && (
              <StyledTabCount>{formatNumber(totalCount)}</StyledTabCount>
            )}
          </StyledTab>
        );
      })}
      <Dropdown
        dropdownId={dropdownId}
        dropdownOffset={{ x: 0, y: 8 }}
        dropdownPlacement="bottom-start"
        onClickOutside={handleClickOutside}
        clickableComponent={
          <StyledMoreButton
            aria-label={t`All views`}
            data-open={isDropdownOpen}
          >
            {hiddenViewCount > 0 && <>+{hiddenViewCount}</>}
            <IconChevronDown size={theme.icon.size.sm} />
          </StyledMoreButton>
        }
        dropdownComponents={
          viewPickerMode === 'list' ? (
            <ViewPickerListContent />
          ) : (
            <>
              {viewPickerMode === 'edit' ? (
                <ViewPickerContentEditMode />
              ) : (
                <ViewPickerContentCreateMode />
              )}
              <ViewPickerContentEffect />
            </>
          )
        }
      />
    </StyledSwitcher>
  );
};
