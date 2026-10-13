import { useIsSettingsDrawer } from '@/smb-shell/navigation/hooks/useIsSettingsDrawer';

import { MainNavigationDrawerContent } from '@/smb-shell/navigation/components/MainNavigationDrawerContent';
import { MainNavigationDrawerModeSwitcher } from '@/smb-shell/navigation/components/MainNavigationDrawerModeSwitcher';
import { NavigationDrawerModesOnlyContent } from '@/smb-shell/navigation/components/NavigationDrawerModesOnlyContent';
import { SettingsNavigationDrawerContent } from '@/smb-shell/navigation/components/SettingsNavigationDrawerContent';
import { useNavigationChromeLayout } from '@/smb-shell/navigation/hooks/useNavigationChromeLayout';
import { NavigationDrawer } from '@/ui/navigation/navigation-drawer/components/NavigationDrawer';
import { NavigationDrawerFixedContent } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerFixedContent';
import { useIsMobile } from 'twenty-ui/utilities';

export type AppNavigationDrawerProps = {
  className?: string;
};

export const AppNavigationDrawer = ({
  className,
}: AppNavigationDrawerProps) => {
  const isMobile = useIsMobile();
  const isSettingsDrawer = useIsSettingsDrawer();
  const { showDrawerModeSwitcher, showModesOnlyInSidebar, showIconRail } =
    useNavigationChromeLayout();

  // The main navigation is the home page on mobile, not a drawer.
  if (isMobile && !isSettingsDrawer) {
    return null;
  }

  if (showModesOnlyInSidebar) {
    return (
      <NavigationDrawer className={className}>
        <NavigationDrawerFixedContent>
          <NavigationDrawerModesOnlyContent />
        </NavigationDrawerFixedContent>
        {isSettingsDrawer && <SettingsNavigationDrawerContent />}
      </NavigationDrawer>
    );
  }

  const shouldShowDrawerModeSwitcher =
    !isMobile && showDrawerModeSwitcher && !showIconRail;

  return (
    <NavigationDrawer className={className}>
      {shouldShowDrawerModeSwitcher && (
        <NavigationDrawerFixedContent>
          <MainNavigationDrawerModeSwitcher />
        </NavigationDrawerFixedContent>
      )}

      {isSettingsDrawer ? (
        <SettingsNavigationDrawerContent />
      ) : (
        <MainNavigationDrawerContent />
      )}
    </NavigationDrawer>
  );
};
