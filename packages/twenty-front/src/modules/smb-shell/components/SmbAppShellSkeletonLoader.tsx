import { styled } from '@linaria/react';
import { useIsMobile } from 'twenty-ui/utilities';

import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { useNavigationDrawerExpanded } from '@/smb-shell/navigation/hooks/useNavigationDrawerExpanded';
import { SmbPageContentSkeletonLoader } from '@/smb-skin/components/SmbPageContentSkeletonLoader';
import { SmbRailSkeletonLoader } from '@/smb-skin/components/SmbRailSkeletonLoader';
import { SmbTopBarSkeletonLoader } from '@/smb-skin/components/SmbTopBarSkeletonLoader';
import { SmbWallpaperLayers } from '@/smb-skin/components/SmbWallpaperLayers';

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100dvh / var(--t-zoom, 1));
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const StyledPageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  min-height: 0;
  min-width: 0;
`;

const StyledRailWrapper = styled.div`
  flex-shrink: 0;
`;

const StyledMainContainer = styled.div`
  display: flex;
  flex: 0 1 100%;
  flex-direction: column;
  min-width: 0;
`;

const StyledMainContent = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
`;

// Boot placeholder shown before the user and metadata are loaded. It carries
// the same data-smb-* hooks as SmbShellLayout and reads the same persisted
// preferences (layout mode, rail state, wallpaper, transparency), so the real
// shell replaces it without anything moving.
export const SmbAppShellSkeletonLoader = () => {
  const isMobile = useIsMobile();
  const isNavigationDrawerExpanded = useNavigationDrawerExpanded();
  const { showSidebar, showIconRail, showTopModeTabs, showTopWorkspaceTabs } =
    useNavigationChromeLayout();

  return (
    <StyledLayout data-smb-layout aria-busy>
      <SmbWallpaperLayers />
      <StyledPageContainer data-smb-page-container data-smb-skeleton>
        {!isMobile && showSidebar && (
          <StyledRailWrapper
            data-smb-rail-wrap
            data-expanded={isNavigationDrawerExpanded}
          >
            <SmbRailSkeletonLoader
              isExpanded={isNavigationDrawerExpanded}
              hasIconRail={showIconRail}
            />
          </StyledRailWrapper>
        )}
        <StyledMainContainer data-smb-main>
          {!isMobile && (
            <SmbTopBarSkeletonLoader
              hasModeTabs={showTopModeTabs}
              hasWorkspaceTabs={showTopWorkspaceTabs}
            />
          )}
          <StyledMainContent>
            <SmbPageContentSkeletonLoader />
          </StyledMainContent>
        </StyledMainContainer>
      </StyledPageContainer>
    </StyledLayout>
  );
};
