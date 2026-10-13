import { useLingui } from '@lingui/react/macro';
import { Card } from 'twenty-ui/primitives/surfaces';

import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { USER_VAR_UI_PREFERENCE_KEYS } from '@/smb-ui-preferences/constants/UserVarUiPreferenceKeys';
import { usePersistedUiPreference } from '@/smb-ui-preferences/hooks/usePersistedUiPreference';
import { layoutModeState } from '@/smb-ui-preferences/states/layoutModeState';
import { type LayoutMode } from '@/smb-ui-preferences/types/LayoutMode';
import { Select } from '@/ui/input/components/Select';

export const LayoutModeSetting = () => {
  const { t } = useLingui();
  const [layoutMode, setLayoutMode] = usePersistedUiPreference(
    layoutModeState,
    USER_VAR_UI_PREFERENCE_KEYS.LAYOUT_MODE,
  );

  return (
    <Card.Root rounded>
      <SettingsOptionCardContentSelect
        title={t`Режим отображения`}
        description={t`Вкладки, сайдбар или оба`}
      >
        <Select<LayoutMode>
          dropdownId="layout-mode-select"
          dropdownWidthAuto
          value={layoutMode}
          onChange={(mode) => {
            void setLayoutMode(mode);
          }}
          options={[
            {
              label: t`Верхние вкладки меняют сайдбар`,
              value: 'linked-tabs',
            },
            {
              label: t`Сайдбар меняет верхние вкладки`,
              value: 'inverted-tabs',
            },
            {
              label: t`Вкладки в сайдбаре`,
              value: 'sidebar-tabs',
            },
            {
              label: t`Двухуровневый сайдбар (Monday)`,
              value: 'two-level',
            },
            {
              label: t`Только сайдбар`,
              value: 'sidebar-only',
            },
            {
              label: t`Только вкладки сверху`,
              value: 'tabs-only',
            },
          ]}
        />
      </SettingsOptionCardContentSelect>
    </Card.Root>
  );
};
