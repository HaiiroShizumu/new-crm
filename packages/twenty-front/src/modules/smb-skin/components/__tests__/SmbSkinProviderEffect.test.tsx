import { act, render } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';

import { SmbSkinProviderEffect } from '@/smb-skin/components/SmbSkinProviderEffect';
import { SMB_ACCENT_PRESETS } from '@/smb-skin/constants/SmbAccentPresets';
import { smbAccentState } from '@/smb-skin/states/smbAccentState';
import { smbSidebarModeState } from '@/smb-skin/states/smbSidebarModeState';
import { resetJotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

const renderSkinEffect = () => {
  const store = resetJotaiStore();

  render(
    <JotaiProvider store={store}>
      <SmbSkinProviderEffect mode="light" />
    </JotaiProvider>,
  );

  return store;
};

describe('SmbSkinProviderEffect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    const root = document.documentElement;

    root.removeAttribute('style');
    Object.keys(root.dataset).forEach((key) => delete root.dataset[key]);
  });

  it('applies the skin attributes and accent variable on the html root', () => {
    const store = renderSkinEffect();
    const root = document.documentElement;

    act(() => {
      store.set(smbAccentState.atom, SMB_ACCENT_PRESETS[1]);
      store.set(smbSidebarModeState.atom, 'edge');
    });

    expect(root.dataset.skin).toBe('smb');
    expect(root.dataset.theme).toBe('light');
    expect(root.dataset.sidebarMode).toBe('edge');
    expect(root.style.getPropertyValue('--color-accent')).toBe(
      SMB_ACCENT_PRESETS[1],
    );
  });
});
