import { isDefined } from 'twenty-shared/utils';

// Keeps the first `maxCount` views as tabs. The current view always has a tab:
// when it sits past the cut it takes the last slot, so the row never shows a
// state where nothing is selected.
export const pickSmbViewTabs = <TView extends { id: string }>({
  views,
  currentViewId,
  maxCount,
}: {
  views: TView[];
  currentViewId?: string;
  maxCount: number;
}): TView[] => {
  const leadingViews = views.slice(0, maxCount);
  const currentView = views.find((view) => view.id === currentViewId);

  if (
    !isDefined(currentView) ||
    leadingViews.some((view) => view.id === currentView.id)
  ) {
    return leadingViews;
  }

  return [...leadingViews.slice(0, maxCount - 1), currentView];
};
