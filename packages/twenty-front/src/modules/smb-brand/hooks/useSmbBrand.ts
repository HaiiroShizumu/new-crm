import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { SMB_PRODUCT_NAME } from '@/smb-brand/constants/SmbProductBrand';
import { SMB_COMPANY_LOGO_URL } from '@/smb-skin/constants/SmbCompanyLogoUrl';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

/**
 * Источник логотипа и названия продукта для оболочки (U-7):
 *
 *   1. настройки компании — `workspace.displayName` / `workspace.logo`
 *      (раздел «Компания» в настройках воркспейса);
 *   2. бренд-слой — `--brand-logo-url` из `smb-brand/brand.css`
 *      (пока `none`, т.е. «брендбук не утверждён»);
 *   3. константы: `SMB_COMPANY_LOGO_URL` и `SMB_PRODUCT_NAME`.
 *
 * Пустое название компании (не заполнено в настройках) не считается заданным —
 * в этом случае показываем название продукта.
 */
const readBrandLogoFromCss = (): string | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const value = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-logo-url')
      .trim();

    if (value === '' || value === 'none' || value === 'normal') {
      return null;
    }

    return value.replace(/^['"]|['"]$/g, '');
  } catch {
    return null;
  }
};

export const useSmbBrand = () => {
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const companyName = currentWorkspace?.displayName?.trim() ?? '';
  const companyLogo = currentWorkspace?.logo?.trim() ?? '';
  const brandLogo = readBrandLogoFromCss();

  return {
    name: companyName !== '' ? companyName : SMB_PRODUCT_NAME,
    logoUrl:
      companyLogo !== '' ? companyLogo : (brandLogo ?? SMB_COMPANY_LOGO_URL),
    isCompanyNameSet: companyName !== '',
    isCompanyLogoSet: companyLogo !== '',
  };
};

export type SmbBrand = ReturnType<typeof useSmbBrand>;
