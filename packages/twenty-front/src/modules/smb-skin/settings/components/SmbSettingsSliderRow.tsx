import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { Slider } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import { isDefined } from 'twenty-shared/utils';

const StyledSliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSliderHeader = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSliderLabel = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledSliderValue = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-variant-numeric: tabular-nums;
`;

const StyledSliderHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

type SmbSettingsSliderRowProps = {
  label: ReactNode;
  valueLabel?: ReactNode;
  hint?: ReactNode;
  ariaLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export const SmbSettingsSliderRow = ({
  label,
  valueLabel,
  hint,
  ariaLabel,
  min,
  max,
  step,
  value,
  disabled = false,
  onChange,
}: SmbSettingsSliderRowProps) => (
  <StyledSliderRow>
    <StyledSliderHeader>
      <StyledSliderLabel>{label}</StyledSliderLabel>
      {isDefined(valueLabel) && (
        <StyledSliderValue>{valueLabel}</StyledSliderValue>
      )}
    </StyledSliderHeader>
    <Slider.Root
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => onChange(nextValue)}
    >
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb aria-label={ariaLabel} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    {isDefined(hint) && <StyledSliderHint>{hint}</StyledSliderHint>}
  </StyledSliderRow>
);
