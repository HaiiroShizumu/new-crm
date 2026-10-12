import { useLingui } from '@lingui/react';
import { useLocation } from 'react-router-dom';

import { useEnabledSmbModules } from '@/smb-modules/hooks/useEnabledSmbModules';
import { type SmbModuleNavigationItem } from '@/smb-modules/types/SmbModuleManifest';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSection } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { useIcons } from 'twenty-ui/icon';

type SmbModuleNavigationGroup = {
  group: string;
  items: SmbModuleNavigationItem[];
};

// U-2: пункты меню оболочки берутся из реестра модулей (ADR-009 п.3), только
// для включённых модулей — useEnabledSmbModules считает их по установленным
// App. Никаких условий вида «isXEnabled && …» здесь и в самом ящике нет.
const groupNavigationItems = (
  items: readonly SmbModuleNavigationItem[],
): SmbModuleNavigationGroup[] =>
  items.reduce<SmbModuleNavigationGroup[]>((groups, item) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.group === item.group) {
      lastGroup.items.push(item);
      return groups;
    }

    return [...groups, { group: item.group, items: [item] }];
  }, []);

export const SmbModuleNavigationItems = () => {
  const { i18n } = useLingui();
  const { getIcon } = useIcons();
  const enabledModules = useEnabledSmbModules();
  const { pathname } = useLocation();

  const groups = groupNavigationItems(
    enabledModules.flatMap((manifest) => manifest.navigation),
  );

  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      {groups.map(({ group, items }) => (
        <NavigationDrawerSection key={group}>
          <NavigationDrawerSectionTitle label={group} />
          {items.map((item) => {
            const isActive =
              pathname === item.to || pathname.startsWith(`${item.to}/`);

            return (
              <NavigationDrawerItem
                key={item.to}
                label={i18n._(item.labelKey)}
                Icon={getIcon(item.icon)}
                to={item.to}
                active={isActive}
              />
            );
          })}
        </NavigationDrawerSection>
      ))}
    </>
  );
};
