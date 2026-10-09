import { clampNumber } from '@/smb-skin/utils/clampNumber';
import { formatHexColor } from '@/smb-skin/utils/formatHexColor';
import { parseHexColor } from '@/smb-skin/utils/parseHexColor';

export const mixHexColors = (
  fromColor: string,
  toColor: string,
  amount: number,
) => {
  const [fromRed, fromGreen, fromBlue] = parseHexColor(fromColor);
  const [toRed, toGreen, toBlue] = parseHexColor(toColor);
  const ratio = clampNumber(amount, 0, 1);

  return formatHexColor([
    fromRed + (toRed - fromRed) * ratio,
    fromGreen + (toGreen - fromGreen) * ratio,
    fromBlue + (toBlue - fromBlue) * ratio,
  ]);
};
