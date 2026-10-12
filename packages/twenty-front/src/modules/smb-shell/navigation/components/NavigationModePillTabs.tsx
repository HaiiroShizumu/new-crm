import { useLingui } from '@lingui/react/macro';
import { IconSearch } from 'twenty-ui/icon';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import {
  NavigationPillTabsShell,
  StyledNavigationPillTab,
} from '@/smb-shell/navigation/components/NavigationPillTabsShell';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useNavigationDrawerModes } from '@/smb-shell/navigation/hooks/useNavigationDrawerModes';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

type NavigationModePillTabsProps = {
  onSearchClick?: () => void;
  showSearchTab?: boolean;
};

export const NavigationModePillTabs = ({
  onSearchClick,
  showSearchTab = false,
}: NavigationModePillTabsProps) => {
  const { t } = useLingui();
  const modes = useNavigationDrawerModes();
  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  if (modes.length === 0) {
    return null;
  }

  return (
    <NavigationPillTabsShell aria-label={t`Navigation modes`}>
      {modes.map(({ Icon, label, mode }) => {
        const isActive = mode === activeNavigationDrawerMode;
        const isDisabled =
          mode !== NAVIGATION_DRAWER_TABS.NAVIGATION_MENU &&
          isLayoutCustomizationModeEnabled;

        return (
          <StyledNavigationPillTab
            key={mode}
            type="button"
            aria-current={isActive}
            aria-disabled={isDisabled}
            title={
              isDisabled ? t`Finish editing the layout to switch` : undefined
            }
            onClick={() => {
              if (isDisabled) {
                return;
              }

              switchNavigationDrawerMode(mode);
            }}
          >
            <Icon size={24} />
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
