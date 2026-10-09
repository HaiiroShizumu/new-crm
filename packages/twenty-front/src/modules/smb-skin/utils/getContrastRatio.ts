export const getContrastRatio = (
  firstLuminance: number,
  secondLuminance: number,
) => {
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};
