const srgbToLinear = (channel: number) => {
  const normalized = channel / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

export const getRelativeLuminance = (
  red: number,
  green: number,
  blue: number,
) =>
  0.2126 * srgbToLinear(red) +
  0.7152 * srgbToLinear(green) +
  0.0722 * srgbToLinear(blue);
