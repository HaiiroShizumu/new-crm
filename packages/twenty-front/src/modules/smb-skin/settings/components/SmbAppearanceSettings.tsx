import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { Section } from 'twenty-ui/components';
import { IconPencil } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

import { useEnterLayoutCustomizationMode } from '@/layout-customization/hooks/useEnterLayoutCustomizationMode';
import { SmbAccentColorSetting } from '@/smb-skin/settings/components/SmbAccentColorSetting';
import { SmbBackgroundPanelsSetting } from '@/smb-skin/settings/components/SmbBackgroundPanelsSetting';
import { SmbSidebarSetting } from '@/smb-skin/settings/components/SmbSidebarSetting';
import { SmbWallpaperSetting } from '@/smb-skin/settings/components/SmbWallpaperSetting';
import { LayoutModeSetting } from '@/smb-ui-preferences/settings/components/LayoutModeSetting';

const StyledCardBody = styled.div`
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledActions = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export const SmbAppearanceSettings = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enterLayoutCustomizationMode } = useEnterLayoutCustomizationMode();

  const handleCustomizeLayout = () => {
    if (enterLayoutCustomizationMode()) {
      navigate(AppPath.Index);
    }
  };

  return (
    <>
      <Section.Root>
        <Section.Header
          title={t`Wallpaper`}
          description={t`Pick a background or upload your own image`}
        />
        <Card.Root rounded>
          <StyledCardBody>
            <SmbWallpaperSetting />
          </StyledCardBody>
        </Card.Root>
      </Section.Root>

      <Section.Root>
        <Section.Header
          title={t`Glass and background`}
          description={t`Adjust how much of the wallpaper shows through the panels`}
        />
        <Card.Root rounded>
          <SmbBackgroundPanelsSetting />
        </Card.Root>
      </Section.Root>

      <Section.Root>
        <Section.Header
          title={t`Accent color`}
          description={t`Used for buttons, links and the active menu item`}
        />
        <Card.Root rounded>
          <StyledCardBody>
            <SmbAccentColorSetting />
          </StyledCardBody>
        </Card.Root>
      </Section.Root>

      <Section.Root>
        <Section.Header
          title={t`Menu`}
          description={t`Choose where the navigation lives and how it looks`}
        />
        <StyledStack>
          <LayoutModeSetting />
          <Card.Root rounded>
            <SmbSidebarSetting />
          </Card.Root>
          <StyledActions>
            <Button
              size="sm"
              startIcon={<IconPencil />}
              onClick={handleCustomizeLayout}
              variant="outline"
            >
              {t`Customize layout`}
            </Button>
          </StyledActions>
        </StyledStack>
      </Section.Root>
    </>
  );
};
