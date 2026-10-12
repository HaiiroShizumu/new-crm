import { type IconComponentProps } from 'twenty-ui/icon';

import { buildHomeLogoPaths } from '@/smb-shell/navigation/branding/utils/buildHomeLogoPaths';

const { viewBox, tiles } = buildHomeLogoPaths();

// The mark is filled while Tabler icons are stroked, so it gets extra padding
// inside the box to carry the same visual weight at the same size.
const VIEWBOX_PADDING = viewBox * 0.1;
const PADDED_VIEWBOX = `${-VIEWBOX_PADDING} ${-VIEWBOX_PADDING} ${
  viewBox + VIEWBOX_PADDING * 2
} ${viewBox + VIEWBOX_PADDING * 2}`;

type IconHomeModeProps = IconComponentProps;

export const IconHomeMode = ({
  className,
  style,
  size = 16,
  color = 'currentColor',
  'aria-hidden': ariaHidden = true,
}: IconHomeModeProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={PADDED_VIEWBOX}
    width={size}
    height={size}
    className={className}
    style={style}
    aria-hidden={ariaHidden}
    fill={color}
  >
    {tiles.map((tile) => (
      <path key={tile.id} d={tile.path} fillOpacity={tile.opacity} />
    ))}
  </svg>
);
