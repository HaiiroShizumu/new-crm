import { NAVIGATION_DRAWER_COLLAPSED_BUTTON_SIZE } from '@/ui/navigation/navigation-drawer/constants/NavigationDrawerCollapsedButtonSize';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { motion, useReducedMotion } from 'framer-motion';
import { Tooltip } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useIsNavigationDrawerContentExpanded } from '@/smb-shell/navigation/hooks/useIsNavigationDrawerContentExpanded';
import { useNavigationDrawerModes } from '@/smb-shell/navigation/hooks/useNavigationDrawerModes';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { layoutModeState } from '@/smb-ui-preferences/states/layoutModeState';
import { TooltipDelay } from '@/ui/layout/tooltip/constants/TooltipDelay';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useIsMobile } from 'twenty-ui/utilities';

const LARGE_MODE_ICON_BUTTON_SIZE_PX = 40;
const LARGE_MODE_ICON_SIZE_PX = 24;

// Expanded, the row is sized off the page card header beside it so the rules
// read as one line across both columns. sidebar-only uses the same row with icons only.
const StyledSwitcher = styled.div<{
  isExpanded: boolean;
  iconsOnly: boolean;
}>`
  align-items: ${({ isExpanded }) => (isExpanded ? 'center' : 'flex-start')};
  border-bottom: ${({ isExpanded }) =>
    isExpanded ? `1px solid ${themeCssVariables.border.color.light}` : 'none'};
  box-sizing: border-box;
  display: flex;
  flex-direction: ${({ isExpanded }) => (isExpanded ? 'row' : 'column')};
  gap: ${({ isExpanded }) =>
    isExpanded
      ? themeCssVariables.spacing['0.5']
      : themeCssVariables.betweenSiblingsGap};
  height: ${({ isExpanded }) =>
    isExpanded ? themeCssVariables.spacing[10] : 'auto'};
  justify-content: ${({ iconsOnly }) =>
    iconsOnly ? 'space-around' : 'flex-start'};
  min-width: 0;
  padding: ${({ iconsOnly }) =>
    iconsOnly ? `${themeCssVariables.spacing[1]} 0` : '0'};
`;

const StyledMode = styled.button<{
  isActive: boolean;
  isExpanded: boolean;
  iconsOnly: boolean;
}>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive ? themeCssVariables.background.transparent.light : 'transparent'};
  border: none;
  border-radius: ${({ isExpanded, iconsOnly }) =>
    iconsOnly || !isExpanded
      ? themeCssVariables.border.radius.mdRound
      : themeCssVariables.border.radius.smRound};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  corner-shape: round;
  cursor: pointer;
  display: flex;
  // Only the mode showing a label may give ground. "AI" is two characters in
  // English and eighteen in Hebrew, and with every mode refusing to shrink the
  // row overflowed and pushed the last one - Settings - off the drawer.
  flex-shrink: ${({ isActive, isExpanded, iconsOnly }) =>
    isActive && isExpanded && !iconsOnly ? 1 : 0};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${({ isActive, isExpanded, iconsOnly }) =>
    isActive && isExpanded && !iconsOnly ? themeCssVariables.spacing[1] : '0'};
  height: ${({ isExpanded, iconsOnly }) => {
    if (iconsOnly) {
      return `${LARGE_MODE_ICON_BUTTON_SIZE_PX}px`;
    }

    return isExpanded
      ? themeCssVariables.spacing[7]
      : `${NAVIGATION_DRAWER_COLLAPSED_BUTTON_SIZE}px`;
  }};
  justify-content: ${({ isExpanded, iconsOnly }) =>
    isExpanded && !iconsOnly ? 'flex-start' : 'center'};
  // A flex item will not shrink past its content without this, so flex-shrink
  // above would have nothing to act on.
  min-width: 0;
  padding: ${({ isExpanded, iconsOnly }) => {
    if (iconsOnly) {
      return '0';
    }

    return isExpanded ? `0 ${themeCssVariables.spacing['1.5']}` : '0';
  }};
  transition:
    background calc(${themeCssVariables.animation.duration.fast} * 1s) ease,
    color calc(${themeCssVariables.animation.duration.fast} * 1s) ease,
    gap calc(${themeCssVariables.animation.duration.normal} * 1s) ease;
  width: ${({ isExpanded, iconsOnly }) => {
    if (iconsOnly) {
      return `${LARGE_MODE_ICON_BUTTON_SIZE_PX}px`;
    }

    return isExpanded ? 'auto' : `${NAVIGATION_DRAWER_COLLAPSED_BUTTON_SIZE}px`;
  }};

  &[aria-disabled='true'] {
    color: ${themeCssVariables.font.color.light};
    cursor: not-allowed;
  }

  &:hover:not([aria-disabled='true']) {
    background: ${({ isActive }) =>
      isActive
        ? themeCssVariables.background.transparent.light
        : themeCssVariables.background.transparent.lighter};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledModeIcon = styled.span<{ iconsOnly: boolean }>`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  height: ${({ iconsOnly }) =>
    iconsOnly
      ? `${LARGE_MODE_ICON_SIZE_PX}px`
      : themeCssVariables.spacing[4]};
  justify-content: center;
  width: ${({ iconsOnly }) =>
    iconsOnly
      ? `${LARGE_MODE_ICON_SIZE_PX}px`
      : themeCssVariables.spacing[4]};
`;

const StyledModeLabelBase = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledModeLabel = motion.create(StyledModeLabelBase);

export const MainNavigationDrawerModeSwitcher = () => {
  const { t } = useLingui();
  const theme = useTheme();

  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const isMobile = useIsMobile();
  const isExpanded = useIsNavigationDrawerContentExpanded();
  const modes = useNavigationDrawerModes();
  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();
  const shouldReduceMotion = useReducedMotion();
  const layoutMode = useAtomStateValue(layoutModeState);
  // sidebar-tabs keeps the expanded labeled row; sidebar-only is icons-only row
  const iconsOnly = layoutMode === 'sidebar-only';

  if (modes.length === 0) {
    return null;
  }

  const shouldShowTooltips = iconsOnly || (!isExpanded && !isMobile);

  return (
    <StyledSwitcher
      isExpanded={isExpanded}
      iconsOnly={iconsOnly}
      role="group"
      aria-label={t`Navigation modes`}
    >
      {modes.map(({ Icon, label, mode }) => {
        const isActive = mode === activeNavigationDrawerMode;
        const isDisabled =
          mode !== NAVIGATION_DRAWER_TABS.NAVIGATION_MENU &&
          isLayoutCustomizationModeEnabled;

        return (
          <Tooltip
            key={mode}
            content={
              isDisabled
                ? t`Finish editing the layout to switch`
                : label
            }
            disabled={!shouldShowTooltips && !isDisabled}
            delay={TooltipDelay.noDelay}
            side={isExpanded ? 'bottom' : 'right'}
            positionMethod="fixed"
          >
            <StyledMode
              type="button"
              isActive={isActive}
              isExpanded={isExpanded}
              iconsOnly={iconsOnly}
              aria-label={label}
              aria-current={isActive}
              aria-disabled={isDisabled}
              onClick={() => {
                if (isDisabled) {
                  return;
                }

                switchNavigationDrawerMode(mode);
              }}
            >
              <StyledModeIcon iconsOnly={iconsOnly}>
                <Icon
                  size={
                    iconsOnly ? LARGE_MODE_ICON_SIZE_PX : theme.icon.size.md
                  }
                />
              </StyledModeIcon>
              {!iconsOnly && (
                <StyledModeLabel
                  initial={false}
                  animate={{ width: isExpanded && isActive ? 'auto' : 0 }}
                  transition={{
                    duration: shouldReduceMotion
                      ? 0
                      : theme.animation.duration.normal,
                    ease: 'easeInOut',
                  }}
                >
                  {label}
                </StyledModeLabel>
              )}
            </StyledMode>
          </Tooltip>
        );
      })}
    </StyledSwitcher>
  );
};
