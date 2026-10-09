import { useSystemColorScheme } from '@/ui/theme/hooks/useSystemColorScheme';
import { persistedColorSchemeState } from '@/ui/theme/states/persistedColorSchemeState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { SmbSkinProviderEffect } from '@/smb-skin/components/SmbSkinProviderEffect';

/**
 * Точка входа скина в дерево провайдеров (шов P-013, см. PATCHES.md).
 *
 * Смонтирован внутри SharedAppProviders: под JotaiProvider (атомы скина
 * читаются через jotaiStore) и внутри BaseThemeProvider — по требованию
 * SmbSkinProviderEffect «land before the parent ThemeProvider snapshots
 * computed CSS variables», то есть layout-effect ребёнка должен отработать
 * раньше layout-effect родителя.
 *
 * mode считаем здесь, а не в правке BaseThemeProvider: дублируется ровно
 * одна строка логики effectiveColorScheme, зато ядро не трогается (ADR-005).
 */
export const SmbSkinEntry = () => {
  const persistedColorScheme = useAtomStateValue(persistedColorSchemeState);
  const systemColorScheme = useSystemColorScheme();
  const effectiveColorScheme =
    persistedColorScheme === 'System' ? systemColorScheme : persistedColorScheme;

  return (
    <SmbSkinProviderEffect
      mode={effectiveColorScheme === 'Dark' ? 'dark' : 'light'}
    />
  );
};
