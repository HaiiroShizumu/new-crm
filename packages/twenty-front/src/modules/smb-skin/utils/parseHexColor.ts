export const parseHexColor = (hexColor: string): [number, number, number] => {
  const hex = hexColor.replace('#', '');
  const fullHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => character + character)
          .join('')
      : hex;

  return [
    Number.parseInt(fullHex.slice(0, 2), 16),
    Number.parseInt(fullHex.slice(2, 4), 16),
    Number.parseInt(fullHex.slice(4, 6), 16),
  ];
};
