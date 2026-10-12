type Corners = { tl: number; tr: number; br: number; bl: number };

const TILE_SIZE = 40;
const TILE_GAP = 6;
const BASE_RADIUS = 4;
const BOWL_RADIUS = TILE_SIZE - BASE_RADIUS;

const fitRadii = (a: number, b: number): [number, number] => {
  const sum = a + b;

  if (sum <= TILE_SIZE) {
    return [a, b];
  }

  const ratio = TILE_SIZE / sum;

  return [a * ratio, b * ratio];
};

const buildRoundedSquarePath = (x: number, y: number, corners: Corners) => {
  let { tl, tr, br, bl } = corners;
  const size = TILE_SIZE;

  [tl, tr] = fitRadii(tl, tr);
  [tr, br] = fitRadii(tr, br);
  [br, bl] = fitRadii(br, bl);
  [bl, tl] = fitRadii(bl, tl);

  return [
    `M${x + tl} ${y}`,
    `H${x + size - tr}`,
    `A${tr} ${tr} 0 0 1 ${x + size} ${y + tr}`,
    `V${y + size - br}`,
    `A${br} ${br} 0 0 1 ${x + size - br} ${y + size}`,
    `H${x + bl}`,
    `A${bl} ${bl} 0 0 1 ${x} ${y + size - bl}`,
    `V${y + tl}`,
    `A${tl} ${tl} 0 0 1 ${x + tl} ${y}`,
    'Z',
  ].join(' ');
};

// Four-tile mark: bowl on each outer corner of the mark, plain R on the
// tile edges along the outer silhouette, sharp corners at the center cross.
export const buildHomeLogoPaths = () => {
  const offset = TILE_SIZE + TILE_GAP;

  return {
    viewBox: TILE_SIZE * 2 + TILE_GAP,
    tiles: [
      {
        id: 'tl',
        opacity: 1,
        path: buildRoundedSquarePath(0, 0, {
          tl: BOWL_RADIUS,
          tr: BASE_RADIUS,
          br: 0,
          bl: BASE_RADIUS,
        }),
      },
      {
        id: 'tr',
        opacity: 0.8,
        path: buildRoundedSquarePath(offset, 0, {
          tl: 0,
          tr: BASE_RADIUS,
          br: BOWL_RADIUS,
          bl: BASE_RADIUS,
        }),
      },
      {
        id: 'bl',
        opacity: 0.86,
        path: buildRoundedSquarePath(0, offset, {
          tl: BASE_RADIUS,
          tr: 0,
          br: BASE_RADIUS,
          bl: BOWL_RADIUS,
        }),
      },
      {
        id: 'br',
        opacity: 0.68,
        path: buildRoundedSquarePath(offset, offset, {
          tl: BASE_RADIUS,
          tr: BOWL_RADIUS,
          br: BASE_RADIUS,
          bl: 0,
        }),
      },
    ],
  };
};
