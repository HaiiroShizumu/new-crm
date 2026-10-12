import { styled } from '@linaria/react';
import { useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { useSmbBrand } from '@/smb-brand/hooks/useSmbBrand';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';

// Purely presentational: the workspace switcher used to live on this spot and
// now sits on its own trigger, so nothing here may be focusable or clickable.
// Layout stays left-anchored in both rail widths so the mark does not jump
// when the drawer animates.
const StyledLockup = styled.div`
  align-items: center;
  display: flex;
  min-width: 0;
  user-select: none;
`;

const StyledLogo = styled.img`
  display: block;
  flex-shrink: 0;
  height: 40px;
  object-fit: contain;
  width: auto;
`;

const StyledWordmark = styled.div`
  font-family: 'Sora', sans-serif;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-left: ${themeCssVariables.spacing[2]};
  white-space: nowrap;
`;

export const SmbBrandLockup = () => {
  const { name, logoUrl } = useSmbBrand();
  // Ассет логотипа по умолчанию в git отсутствует (см. SmbProductBrand) —
  // прячем картинку вместо «битого» изображения.
  const [isLogoBroken, setIsLogoBroken] = useState(false);

  return (
    <StyledLockup data-smb-brand-lockup data-smb-brand-name={name}>
      {!isLogoBroken && logoUrl !== '' && (
        <StyledLogo
          src={logoUrl}
          alt=""
          onError={() => setIsLogoBroken(true)}
        />
      )}
      <NavigationDrawerAnimatedCollapseWrapper>
        <StyledWordmark>{name}</StyledWordmark>
      </NavigationDrawerAnimatedCollapseWrapper>
    </StyledLockup>
  );
};
