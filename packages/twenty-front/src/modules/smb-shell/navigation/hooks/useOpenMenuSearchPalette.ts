import { useCallback } from 'react';

import { MENU_SEARCH_PALETTE_DIALOG_ID } from '@/smb-shell/navigation/constants/MenuSearchPaletteDialogId';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';

export const useOpenMenuSearchPalette = () => {
  const { openDialog } = useDialog();

  const openMenuSearchPalette = useCallback(() => {
    openDialog(MENU_SEARCH_PALETTE_DIALOG_ID);
  }, [openDialog]);

  return { openMenuSearchPalette };
};
