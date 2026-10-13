import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { isSmbEmbedded } from '@/smb-embed/utils/isSmbEmbedded';
import { isMatchingLocation } from '~/utils/isMatchingLocation';

export const useShowFullscreen = () => {
  const location = useLocation();

  return useMemo(() => {
    if (isSmbEmbedded()) {
      return true;
    }

    if (
      isMatchingLocation(
        location,
        'settings/' + SettingsPath.RestPlayground + '/*',
      ) ||
      isMatchingLocation(location, 'settings/' + SettingsPath.GraphQLPlayground)
    ) {
      return true;
    }

    return false;
  }, [location]);
};
