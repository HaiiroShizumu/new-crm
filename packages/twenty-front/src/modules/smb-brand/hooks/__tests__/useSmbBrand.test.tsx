import { act, renderHook } from '@testing-library/react';
import { Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import {
  currentWorkspaceState,
  type CurrentWorkspace,
} from '@/auth/states/currentWorkspaceState';
import { SMB_PRODUCT_NAME } from '@/smb-brand/constants/SmbProductBrand';
import { useSmbBrand } from '@/smb-brand/hooks/useSmbBrand';
import { SMB_COMPANY_LOGO_URL } from '@/smb-skin/constants/SmbCompanyLogoUrl';
import { resetJotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';

const wrapper =
  (store: ReturnType<typeof resetJotaiStore>) =>
  ({ children }: { children: ReactNode }) => (
    <JotaiProvider store={store}>{children}</JotaiProvider>
  );

const workspaceWith = (
  displayName: string | undefined,
  logo: string | undefined,
) => ({ id: 'workspace-id', displayName, logo }) as unknown as CurrentWorkspace;

const renderBrand = (workspace: CurrentWorkspace | null) => {
  const store = resetJotaiStore();

  if (workspace !== null) {
    act(() => {
      store.set(currentWorkspaceState.atom, workspace);
    });
  }

  return renderHook(() => useSmbBrand(), { wrapper: wrapper(store) });
};

describe('useSmbBrand', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to the brand defaults when the company settings are empty', () => {
    const { result } = renderBrand(null);

    expect(result.current.name).toBe(SMB_PRODUCT_NAME);
    expect(result.current.logoUrl).toBe(SMB_COMPANY_LOGO_URL);
    expect(result.current.isCompanyNameSet).toBe(false);
    expect(result.current.isCompanyLogoSet).toBe(false);
  });

  it('uses the company name and logo from the workspace settings', () => {
    const { result } = renderBrand(
      workspaceWith('ООО Ромашка', '/uploads/logo.png'),
    );

    expect(result.current.name).toBe('ООО Ромашка');
    expect(result.current.logoUrl).toBe('/uploads/logo.png');
    expect(result.current.isCompanyNameSet).toBe(true);
    expect(result.current.isCompanyLogoSet).toBe(true);
  });

  it('ignores a blank company name', () => {
    const { result } = renderBrand(workspaceWith('   ', undefined));

    expect(result.current.name).toBe(SMB_PRODUCT_NAME);
    expect(result.current.isCompanyNameSet).toBe(false);
  });
});
