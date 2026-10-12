import { isNonEmptyString } from '@sniptt/guards';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useMenuSearchEntries } from '@/smb-shell/navigation/hooks/useMenuSearchEntries';
import { recentMenuNavigationTransitionsState } from '@/smb-shell/navigation/states/recentMenuNavigationTransitionsState';
import { addRecentNavigationTransition } from '@/smb-shell/navigation/utils/addRecentNavigationTransition';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const getFallbackLabelFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(isNonEmptyString);

  return segments.at(-1) ?? pathname;
};

export const RecordRecentMenuNavigationTransitionEffect = () => {
  const location = useLocation();
  const entries = useMenuSearchEntries();
  const setRecentMenuNavigationTransitions = useSetAtomState(
    recentMenuNavigationTransitionsState,
  );
  useEffect(() => {
    const pathname = location.pathname;

    if (!isNonEmptyString(pathname)) {
      return;
    }

    const currentEntries = entries;
    const exactMatch = currentEntries.find((entry) => entry.path === pathname);
    const prefixMatch = currentEntries
      .filter(
        (entry) =>
          entry.path !== '/' &&
          (pathname === entry.path || pathname.startsWith(`${entry.path}/`)),
      )
      .sort((left, right) => right.path.length - left.path.length)[0];
    const matchedEntry = exactMatch ?? prefixMatch;
    const label = matchedEntry?.label ?? getFallbackLabelFromPath(pathname);

    setRecentMenuNavigationTransitions((current) => {
      if (current[0]?.path === pathname && current[0]?.label === label) {
        return current;
      }

      return addRecentNavigationTransition(current, {
        path: pathname,
        label,
      });
    });
  }, [entries, location.pathname, setRecentMenuNavigationTransitions]);

  return null;
};
