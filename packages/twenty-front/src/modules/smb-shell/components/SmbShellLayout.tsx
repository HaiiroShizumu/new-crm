import { AppErrorBoundary } from '@/error-handler/components/AppErrorBoundary';
import { AppFullScreenErrorFallback } from '@/error-handler/components/AppFullScreenErrorFallback';
import { AppPageErrorFallback } from '@/error-handler/components/AppPageErrorFallback';
import { FileUploadProvider } from '@/file-upload/components/FileUploadProvider';
import { InformationBannerIsImpersonating } from '@/information-banner/components/impersonate/InformationBannerIsImpersonating';
import { KeyboardShortcutMenu } from '@/keyboard-shortcut-menu/components/KeyboardShortcutMenu';
import { LayoutCustomizationBar } from '@/layout-customization/components/LayoutCustomizationBar';
import { SmbApplicationLifecycleLoaders } from '@/smb-modules/components/SmbApplicationLifecycleLoaders';
import { AppTopBar } from '@/smb-shell/components/SmbAppTopBar';
import { SmbChromeHeaderPortalProvider } from '@/smb-shell/components/SmbChromeHeaderPortalProvider';
import { AppNavigationDrawer } from '@/smb-shell/navigation/components/AppNavigationDrawer';
import { MenuSearchPalette } from '@/smb-shell/navigation/components/MenuSearchPalette';
import { MobileNavigationBar } from '@/smb-shell/navigation/components/MobileNavigationBar';
import { TwoLevelNavigationRail } from '@/smb-shell/navigation/components/TwoLevelNavigationRail';
import { useIsSettingsDrawer } from '@/smb-shell/navigation/hooks/useIsSettingsDrawer';
import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { useNavigationDrawerExpanded } from '@/smb-shell/navigation/hooks/useNavigationDrawerExpanded';
import { RecordRecentMenuNavigationTransitionEffect } from '@/smb-shell/navigation/hooks/useRecordRecentMenuNavigationTransition';
import { PageDragDropProvider } from '@/navigation-menu-item/display/dnd/providers/PageDragDropProvider';
import { SmbWallpaperLayers } from '@/smb-skin/components/SmbWallpaperLayers';
import { useShowFullscreen } from '@/ui/layout/fullscreen/hooks/useShowFullscreen';
import { styled } from '@linaria/react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from 'twenty-ui/utilities';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100dvh / var(--t-zoom, 1));
  overflow: hidden;
  position: relative;
  scrollbar-color: ${themeCssVariables.border.color.medium} transparent;
  scrollbar-width: 4px;
  width: 100%;

  *::-webkit-scrollbar-thumb {
    border-radius: ${themeCssVariables.border.radius.md};
  }

  @media print {
    background: ${themeCssVariables.background.primary};
    height: auto;
    min-height: 100%;
    overflow: visible;
  }
`;

const StyledPageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  min-height: 0;
  min-width: 0;

  @media print {
    display: block;
    min-height: auto;
    min-width: auto;
    overflow: visible;
  }
`;

const StyledNavigationDrawerWrapper = styled.div`
  flex-shrink: 0;
  position: relative;

  @media print {
    display: none;
  }
`;

const StyledRailContent = styled.div`
  height: 100%;
  position: relative;
  z-index: 1;
`;

const StyledMainContainer = styled.div`
  display: flex;
  flex: 0 1 100%;
  flex-direction: column;
  min-width: 0;

  @media print {
    display: block;
    min-width: auto;
    overflow: visible;
  }
`;

const StyledMainContent = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;

  @media print {
    display: block;
    min-height: auto;
    min-width: auto;
    overflow: visible;
  }
`;

// U-2: сборка оболочки (боковая панель + верхняя панель + главная область)
// перенесена из DefaultLayout старого билда. Имя экспорта — SmbShellLayout,
// точка подключения P-015 — в useCreateWorkspaceAppRouter.
// Embed-ветка doc-management (isDocManagementEmbedShell) убрана: в v2.45.6
// модуля doc-management нет, она вернётся с D-блоком (U-5).
export const SmbShellLayout = () => {
  const isMobile = useIsMobile();
  const useShowFullScreen = useShowFullscreen();
  const isNavigationDrawerExpanded = useNavigationDrawerExpanded();
  const isSettingsDrawer = useIsSettingsDrawer();
  const { showSidebar, showIconRail } = useNavigationChromeLayout();

  // Settings keeps a drawer even in tabs-only; mobile only mounts the drawer
  // on settings routes (see AppNavigationDrawer).
  const shouldShowNavigationRail =
    !useShowFullScreen && (showSidebar || isSettingsDrawer);
  const shouldUseTwoLevelRail = showIconRail && showSidebar && !isMobile;
  const shouldShowAppTopBar = !isMobile && !useShowFullScreen;
  const shouldShowMobileNavigationBar = isMobile;

  return (
    <>
      {/* RV-2: следит за статусами установки/удаления App модулей реестра */}
      <SmbApplicationLifecycleLoaders />
      <FileUploadProvider>
        <StyledLayout data-smb-layout>
          <SmbWallpaperLayers />
          <AppErrorBoundary FallbackComponent={AppFullScreenErrorFallback}>
            <InformationBannerIsImpersonating />
            <LayoutCustomizationBar />
            <StyledPageContainer data-smb-page-container>
              <PageDragDropProvider>
                <KeyboardShortcutMenu />
                <MenuSearchPalette />
                <RecordRecentMenuNavigationTransitionEffect />
                {shouldShowNavigationRail ? (
                  <StyledNavigationDrawerWrapper
                    data-smb-rail-wrap
                    data-expanded={isNavigationDrawerExpanded}
                  >
                    <StyledRailContent>
                      {shouldUseTwoLevelRail ? (
                        <TwoLevelNavigationRail />
                      ) : (
                        <AppNavigationDrawer />
                      )}
                    </StyledRailContent>
                  </StyledNavigationDrawerWrapper>
                ) : null}
                <StyledMainContainer data-smb-main>
                  {shouldShowAppTopBar ? <AppTopBar /> : null}
                  <StyledMainContent>
                    <AppErrorBoundary FallbackComponent={AppPageErrorFallback}>
                      <SmbChromeHeaderPortalProvider>
                        <Outlet />
                      </SmbChromeHeaderPortalProvider>
                    </AppErrorBoundary>
                  </StyledMainContent>
                </StyledMainContainer>
              </PageDragDropProvider>
            </StyledPageContainer>
            {shouldShowMobileNavigationBar ? <MobileNavigationBar /> : null}
          </AppErrorBoundary>
        </StyledLayout>
      </FileUploadProvider>
    </>
  );
};
