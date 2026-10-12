import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

export const StyledNavigationPillTabs = styled.div`
  backdrop-filter: blur(var(--smb-blur-l1));
  background: var(--smb-surface-l1);
  border: 1px solid var(--smb-border-l1);
  border-radius: 999px;
  box-shadow: var(--smb-shadow-l1);
  display: inline-flex;
  gap: 2px;
  isolation: isolate;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  padding: 3px;
  scrollbar-width: none;
`;

export const StyledNavigationPillTab = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  gap: 6px;
  padding: 4px 14px 4px 10px;
  text-shadow: var(--chrome-text-shadow);
  transition:
    background 0.15s ease,
    color 0.2s ease;
  white-space: nowrap;

  &:hover:not([aria-current='true']):not([aria-disabled='true']) {
    background: color-mix(
      in srgb,
      var(--color-surface-solid) 28%,
      transparent
    );
    color: var(--color-text);
  }

  &[aria-current='true'] {
    background: ${themeCssVariables.color.blue};
    color: ${themeCssVariables.font.color.inverted};
    text-shadow: none;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

type NavigationPillTabsShellProps = {
  'aria-label': string;
  children: ReactNode;
};

export const NavigationPillTabsShell = ({
  'aria-label': ariaLabel,
  children,
}: NavigationPillTabsShellProps) => {
  return (
    <StyledNavigationPillTabs role="group" aria-label={ariaLabel}>
      {children}
    </StyledNavigationPillTabs>
  );
};
