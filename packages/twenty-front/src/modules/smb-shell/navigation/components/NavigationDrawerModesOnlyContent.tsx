import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useNavigationDrawerModes } from '@/smb-shell/navigation/hooks/useNavigationDrawerModes';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.betweenSiblingsGap};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledModeButton = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: 100%;

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:hover:not([aria-disabled='true']) {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

export const NavigationDrawerModesOnlyContent = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const modes = useNavigationDrawerModes();
  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );

  return (
    <StyledList role="group" aria-label={t`Navigation modes`}>
      {modes.map(({ Icon, label, mode }) => {
        const isActive = mode === activeNavigationDrawerMode;
        const isDisabled =
          mode !== NAVIGATION_DRAWER_TABS.NAVIGATION_MENU &&
          isLayoutCustomizationModeEnabled;

        return (
          <StyledModeButton
            key={mode}
            type="button"
            isActive={isActive}
            aria-current={isActive}
            aria-disabled={isDisabled}
            onClick={() => {
              if (isDisabled) {
                return;
              }

              switchNavigationDrawerMode(mode);
            }}
          >
            <Icon size={theme.icon.size.md} />
            {label}
          </StyledModeButton>
        );
      })}
    </StyledList>
  );
};
