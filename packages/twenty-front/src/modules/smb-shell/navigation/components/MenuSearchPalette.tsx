import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { CommandMenuItem } from '@/command-menu/components/CommandMenuItem';
import { useNavigateToNavigationMenuItemLink } from '@/navigation-menu-item/common/hooks/useNavigateToNavigationMenuItemLink';
import { MENU_SEARCH_PALETTE_DIALOG_ID } from '@/smb-shell/navigation/constants/MenuSearchPaletteDialogId';
import { useMenuSearchEntries } from '@/smb-shell/navigation/hooks/useMenuSearchEntries';
import { useSwitchNavigationDrawerMode } from '@/smb-shell/navigation/hooks/useSwitchNavigationDrawerMode';
import { recentMenuNavigationTransitionsState } from '@/smb-shell/navigation/states/recentMenuNavigationTransitionsState';
import { type MenuSearchEntry } from '@/smb-shell/navigation/types/MenuSearchEntry';
import { filterMenuSearchEntries } from '@/smb-shell/navigation/utils/filterMenuSearchEntries';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { isDialogOpenedComponentState } from '@/ui/layout/dialog/states/isDialogOpenedComponentState';
import { DropdownMenuSearchInput } from '@/ui/layout/dropdown/components/DropdownMenuSearchInput';
import { SelectableList } from '@/ui/layout/selectable-list/components/SelectableList';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const MENU_SEARCH_PALETTE_SELECTABLE_LIST_ID = 'menu-search-palette-list';

const StyledPopup = styled.div`
  display: flex;
  flex-direction: column;
  max-height: min(78vh, 720px);
  min-height: 320px;
  width: 100%;
`;

const StyledSearchRow = styled.div`
  border-bottom: 1px solid
    var(--smb-border-l1, ${themeCssVariables.border.color.light});
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-height: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]}
    ${themeCssVariables.spacing[3]};
`;

const StyledSectionHeading = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[1]};
  text-transform: uppercase;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  height: 96px;
  justify-content: center;
`;

type MenuSearchPaletteContentProps = {
  onSelectEntry: (entry: MenuSearchEntry) => void;
};

const MenuSearchPaletteContent = ({
  onSelectEntry,
}: MenuSearchPaletteContentProps) => {
  const { t } = useLingui();
  const [searchQuery, setSearchQuery] = useState('');
  const entries = useMenuSearchEntries();
  const recentMenuNavigationTransitions = useAtomStateValue(
    recentMenuNavigationTransitionsState,
  );

  const filteredEntries = useMemo(
    () =>
      filterMenuSearchEntries({
        entries,
        searchQuery,
      }),
    [entries, searchQuery],
  );

  const recentEntries = useMemo(() => {
    return recentMenuNavigationTransitions
      .map((transition) => {
        const matchedEntry = entries.find(
          (entry) =>
            entry.path === transition.path ||
            (entry.path !== '/' &&
              transition.path.startsWith(`${entry.path}/`)),
        );

        return matchedEntry ?? null;
      })
      .filter(isDefined)
      .filter(
        (entry, index, all) =>
          all.findIndex((candidate) => candidate.id === entry.id) === index,
      )
      .slice(0, 8);
  }, [entries, recentMenuNavigationTransitions]);

  const favoriteEntries = useMemo(
    () => entries.filter((entry) => entry.section === 'menu').slice(0, 12),
    [entries],
  );

  const isSearching = searchQuery.trim().length > 0;
  const idleEntries = useMemo(() => {
    const recentIds = new Set(recentEntries.map((entry) => entry.id));

    return [
      ...recentEntries,
      ...favoriteEntries.filter((entry) => !recentIds.has(entry.id)),
    ];
  }, [favoriteEntries, recentEntries]);

  const visibleEntries = isSearching ? filteredEntries : idleEntries;
  const selectableItemIds = visibleEntries.map((entry) => entry.id);

  return (
    <StyledPopup>
      <StyledSearchRow>
        <DropdownMenuSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t`Search menu...`}
          autoFocus
        />
      </StyledSearchRow>
      <StyledList>
        <SelectableList
          selectableListInstanceId={MENU_SEARCH_PALETTE_SELECTABLE_LIST_ID}
          focusId={MENU_SEARCH_PALETTE_DIALOG_ID}
          selectableItemIdArray={selectableItemIds}
        >
          {!isSearching && recentEntries.length > 0 && (
            <StyledSectionHeading>{t`Recent`}</StyledSectionHeading>
          )}
          {!isSearching &&
            recentEntries.map((entry) => (
              <SelectableListItem
                key={entry.id}
                itemId={entry.id}
                onEnter={() => onSelectEntry(entry)}
              >
                <CommandMenuItem
                  id={entry.id}
                  label={entry.label}
                  Icon={entry.Icon}
                  onClick={() => onSelectEntry(entry)}
                />
              </SelectableListItem>
            ))}
          {!isSearching && favoriteEntries.length > 0 && (
            <StyledSectionHeading>{t`Menu`}</StyledSectionHeading>
          )}
          {!isSearching &&
            favoriteEntries
              .filter(
                (entry) =>
                  !recentEntries.some((recent) => recent.id === entry.id),
              )
              .map((entry) => (
                <SelectableListItem
                  key={entry.id}
                  itemId={entry.id}
                  onEnter={() => onSelectEntry(entry)}
                >
                  <CommandMenuItem
                    id={entry.id}
                    label={entry.label}
                    Icon={entry.Icon}
                    onClick={() => onSelectEntry(entry)}
                  />
                </SelectableListItem>
              ))}
          {isSearching && filteredEntries.length > 0 && (
            <StyledSectionHeading>{t`Results`}</StyledSectionHeading>
          )}
          {isSearching &&
            filteredEntries.map((entry) => (
              <SelectableListItem
                key={entry.id}
                itemId={entry.id}
                onEnter={() => onSelectEntry(entry)}
              >
                <CommandMenuItem
                  id={entry.id}
                  label={entry.label}
                  Icon={entry.Icon}
                  onClick={() => onSelectEntry(entry)}
                />
              </SelectableListItem>
            ))}
          {visibleEntries.length === 0 && (
            <StyledEmpty>
              {isSearching ? t`No results` : t`No recent transitions`}
            </StyledEmpty>
          )}
        </SelectableList>
      </StyledList>
    </StyledPopup>
  );
};

export const MenuSearchPalette = () => {
  const isDialogOpened = useAtomComponentStateValue(
    isDialogOpenedComponentState,
    MENU_SEARCH_PALETTE_DIALOG_ID,
  );
  const { closeDialog } = useDialog();
  const { navigateToNavigationMenuItemLink } =
    useNavigateToNavigationMenuItemLink();
  const { switchNavigationDrawerMode } = useSwitchNavigationDrawerMode();

  const handleSelectEntry = (entry: MenuSearchEntry) => {
    closeDialog(MENU_SEARCH_PALETTE_DIALOG_ID);

    if (isDefined(entry.mode)) {
      switchNavigationDrawerMode(entry.mode);
      return;
    }

    navigateToNavigationMenuItemLink(entry.path);
  };

  return (
    <DialogInstance
      dialogId={MENU_SEARCH_PALETTE_DIALOG_ID}
      dismissible={true}
      renderInDocumentBody
    >
      {({ container, backdrop, viewportProps, onKeyDown }) => (
        <Dialog.Popup
          container={container}
          backdrop={{
            // v2.45.6: тип backdrop — `boolean | Backdrop.Props`, поэтому
            // сужаем перед спредом (старая база отдавала всегда объект).
            ...(typeof backdrop === 'object' ? backdrop : {}),
            style: {
              ...(typeof backdrop === 'object' ? backdrop.style : {}),
              background: 'var(--smb-scrim)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            },
          }}
          onKeyDown={onKeyDown}
          size="xl"
          data-globally-prevent-click-outside
          data-smb-surface="l1"
          viewportProps={{
            ...viewportProps,
            style: {
              ...viewportProps?.style,
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '12vh',
            },
          }}
          style={{
            padding: 0,
            width: 'min(820px, calc(100vw - 48px))',
            maxHeight: 'min(78vh, 720px)',
            overflow: 'hidden',
            background:
              'var(--smb-surface-l1, var(--t-background-transparent-primary))',
            backdropFilter: 'blur(var(--smb-blur-l1, 24px))',
            WebkitBackdropFilter: 'blur(var(--smb-blur-l1, 24px))',
            border:
              '1px solid var(--smb-border-l1, var(--t-border-color-medium))',
            borderRadius: 'var(--radius-panel, var(--t-border-radius-xl))',
            boxShadow: 'var(--smb-shadow-l1, var(--t-box-shadow-strong))',
            isolation: 'isolate',
          }}
        >
          {isDialogOpened ? (
            <MenuSearchPaletteContent onSelectEntry={handleSelectEntry} />
          ) : null}
        </Dialog.Popup>
      )}
    </DialogInstance>
  );
};
