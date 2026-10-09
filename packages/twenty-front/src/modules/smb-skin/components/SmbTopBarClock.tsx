import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react';
import { useEffect, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const CLOCK_TICK_INTERVAL_MS = 15_000;

const StyledTime = styled.span`
  font-size: ${themeCssVariables.font.size.lg};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const SmbTopBarClock = () => {
  const { i18n } = useLingui();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(
      () => setNow(new Date()),
      CLOCK_TICK_INTERVAL_MS,
    );

    return () => clearInterval(intervalId);
  }, []);

  return (
    <StyledTime data-smb-top-clock>
      {i18n.date(now, { hour: '2-digit', minute: '2-digit' })}
    </StyledTime>
  );
};
