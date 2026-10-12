import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  IconChevronRight,
  IconLayoutSidebarLeftCollapse,
} from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { AppNavigationDrawer } from '@/smb-shell/navigation/components/AppNavigationDrawer';
import { useActiveNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useActiveNavigationDrawerMode';
import { useNavigationDrawerModes } from '@/smb-shell/navigation/hooks/useNavigationDrawerModes';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { isSecondaryNavigationSidebarOpenState } from '@/smb-shell/navigation/states/isSecondaryNavigationSidebarOpenState';
import { APP_HEADER_HEIGHT } from '@/ui/layout/constants/AppHeaderHeight';
import { NAVIGATION_DRAWER_TABS } from '@/ui/navigation/states/navigationDrawerTabs';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const ICON_RAIL_WIDTH_PX = 80;
const ICON_RAIL_GLYPH_SIZE_PX = 52;

const StyledRail = styled.div`
  border-radius: ${themeCssVariables.border.radius.xl}
    ${themeCssVariables.border.radius.xl} 0 0;
  display: flex;
  flex-shrink: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const StyledIconRail = styled.div`
  align-items: stretch;
  background: ${themeCssVariables.background.tertiary};
  border-right: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[1]}
    ${themeCssVariables.spacing[2]};
  width: ${ICON_RAIL_WIDTH_PX}px;
`;

const StyledIconButton = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.xxs};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  justify-content: center;
  line-height: 1.2;
  padding: ${themeCssVariables.spacing[1]} 0;
  width: 100%;

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:hover:not([aria-disabled='true']) {
    color: ${themeCssVariables.font.color.primary};
  }

  &:hover:not([aria-disabled='true']) [data-icon-glyph] {
    background: ${({ isActive }) =>
      isActive
        ? themeCssVariables.background.transparent.blue
        : themeCssVariables.background.transparent.light};
  }
`;

const StyledIconGlyph = styled.span<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.background.transparent.blue
      : 'transparent'};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: inline-flex;
  height: ${ICON_RAIL_GLYPH_SIZE_PX}px;
  justify-content: center;
  width: ${ICON_RAIL_GLYPH_SIZE_PX}px;
`;

const StyledIconLabel = styled.span`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  padding: 0 2px;
  text-align: center;
`;

const StyledSecondary = styled.div`
  background: ${themeCssVariables.background.primary};
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  position: relative;
`;

const StyledSecondaryToolbar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  height: ${APP_HEADER_HEIGHT}px;
  justify-content: space-between;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledWorkspaceLabel = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const StyledCollapseButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  margin-left: auto;
  padding: ${themeCssVariables.spacing[1]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledSecondaryBody = styled.div`
  border-top-left-radius: ${themeCssVariables.border.radius.xl};
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

const StyledExpandInRail = styled.div`
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-bottom: ${themeCssVariables.spacing[1]};
`;

export const TwoLevelNavigationRail = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const modes = useNavigationDrawerModes();
  const activeNavigationDrawerMode = useActiveNavigationDrawerMode();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const [isSecondaryNavigationSidebarOpen, setIsSecondaryNavigationSidebarOpen] = useAtomState(
    isSecondaryNavigationSidebarOpenState,
  );

  return (
    <StyledRail data-two-level-nav>
      <StyledIconRail role="group" aria-label={t`Navigation modes`}>
        {modes.map(({ Icon, label, mode }) => {
          const isActive = mode === activeNavigationDrawerMode;
          const isDisabled =
            mode !== NAVIGATION_DRAWER_TABS.NAVIGATION_MENU &&
            isLayoutCustomizationModeEnabled;

          return (
            <StyledIconButton
              key={mode}
              type="button"
              isActive={isActive}
              aria-label={label}
              aria-current={isActive}
              aria-disabled={isDisabled}
              title={label}
              onClick={() => {
                if (isDisabled) {
                  return;
                }

                switchNavigationDrawerMode(mode);

                if (!isSecondaryNavigationSidebarOpen) {
                  setIsSecondaryNavigationSidebarOpen(true);
                }
              }}
            >
              <StyledIconGlyph data-icon-glyph isActive={isActive}>
                <Icon
                  size={theme.icon.size.xl}
                  stroke={theme.icon.stroke.lg}
                />
              </StyledIconGlyph>
              <StyledIconLabel>{label}</StyledIconLabel>
            </StyledIconButton>
          );
        })}
        {!isSecondaryNavigationSidebarOpen && (
          <StyledExpandInRail>
            <StyledCollapseButton
              type="button"
              aria-label={t`Expand sidebar`}
              onClick={() => setIsSecondaryNavigationSidebarOpen(true)}
            >
              <IconChevronRight size={theme.icon.size.sm} />
            </StyledCollapseButton>
          </StyledExpandInRail>
        )}
      </StyledIconRail>
      {isSecondaryNavigationSidebarOpen && (
        <StyledSecondary>
          <StyledSecondaryToolbar>
            <StyledWorkspaceLabel>{t`Workspace`}</StyledWorkspaceLabel>
            <StyledCollapseButton
              type="button"
              aria-label={t`Collapse sidebar`}
              onClick={() => setIsSecondaryNavigationSidebarOpen(false)}
            >
              <IconLayoutSidebarLeftCollapse size={theme.icon.size.sm} />
            </StyledCollapseButton>
          </StyledSecondaryToolbar>
          <StyledSecondaryBody>
            <AppNavigationDrawer />
          </StyledSecondaryBody>
        </StyledSecondary>
      )}
    </StyledRail>
  );
};
