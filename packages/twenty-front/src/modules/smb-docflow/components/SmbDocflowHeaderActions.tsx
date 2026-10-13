import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbEmbedCrmButton } from '@/smb-embed/components/SmbEmbedCrmButton';
import { SmbEmbedFullscreenButton } from '@/smb-embed/components/SmbEmbedFullscreenButton';
import { isSmbEmbedded } from '@/smb-embed/utils/isSmbEmbedded';

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

// Both buttons only make sense inside the portal: in the CRM itself there is
// no frame to expand and nowhere else to go.
export const SmbDocflowHeaderActions = () => {
  if (!isSmbEmbedded()) {
    return null;
  }

  return (
    <StyledActions>
      <SmbEmbedFullscreenButton />
      <SmbEmbedCrmButton />
    </StyledActions>
  );
};
