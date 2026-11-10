import {
  HALO_DARK,
  HALO_EDGE,
  HALO_LIGHT,
  HALO_WIDTH,
  type PinProps,
} from "../../src";

// folklorico's papel picado flag pin (src/components/papel-picado), as an
// example of a custom `pin`

// The flag's shape, in its own units
const FLAG_WIDTH = 88;
const FLAG_HEIGHT = 112;
const TEETH = 6;

// Outline whose bottom edge zigzags like cut tissue paper
function flagPath() {
  const tooth = FLAG_WIDTH / TEETH;
  const base = FLAG_HEIGHT - 12;
  let d = `M0 0H${FLAG_WIDTH}V${base}`;
  for (let i = TEETH; i > 0; i--) {
    const x = i * tooth;
    d += `L${x - tooth / 2} ${FLAG_HEIGHT}L${x - tooth} ${base}`;
  }
  return `${d}Z`;
}

// Petals around a center, for the flower cut-out
function petals(cx: number, cy: number, r: number, count: number, size: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return (
      <circle
        key={i}
        cx={cx + Math.cos(a) * r}
        cy={cy + Math.sin(a) * r}
        r={size}
      />
    );
  });
}

const MID = FLAG_WIDTH / 2;

// The center flower and corner diamonds, drawn in black inside a mask
function FlagCutouts() {
  return (
    <>
      <circle cx={MID} cy={54} r={7} />
      {petals(MID, 54, 17, 8, 6)}
      <path d="M14 36l6 8-6 8-6-8z" />
      <path d={`M${FLAG_WIDTH - 14} 36l6 8-6 8-6-8z`} />
      <path d="M14 70l6 8-6 8-6-8z" />
      <path d={`M${FLAG_WIDTH - 14} 70l6 8-6 8-6-8z`} />
    </>
  );
}

// The point of the flag on the feature: its center, as it has no tip
export const PAPEL_PICADO_PIN_ANCHOR: [number, number] = [0.5, 0.5];

// On-screen width of the flag in pixels; the default pin is 24 wide
const WIDTH = 26;
const SCALE = WIDTH / FLAG_WIDTH;
const HEIGHT = FLAG_HEIGHT * SCALE;
// Room around the outline for the hovered halo, as in the default pin
const PAD = HALO_WIDTH / 2 + HALO_EDGE;

const PATH = flagPath();

// Opaque enough to survive the image's 8-bit alpha (over 1/255), too faint to
// see
const HIT_BACKING_OPACITY = 0.02;

// A single papel picado flag, in the layer's color. The cut-outs show the map
// through. Strokes keep their pixel width however the flag is scaled.
export function PapelPicadoPin({ hovered, colors }: PinProps) {
  const stroke = {
    vectorEffect: "non-scaling-stroke",
    strokeLinejoin: "round",
  } as const;
  return (
    <svg
      width={WIDTH + 2 * PAD}
      height={HEIGHT + 2 * PAD}
      viewBox={`${-PAD} ${-PAD} ${WIDTH + 2 * PAD} ${HEIGHT + 2 * PAD}`}
    >
      <defs>
        {/* Rendered alone as an image, so a fixed id can't clash */}
        <mask id="cut" maskContentUnits="userSpaceOnUse">
          <path d={PATH} fill="#fff" />
          <g fill="#000">
            <FlagCutouts />
          </g>
        </mask>
      </defs>
      <g transform={`scale(${SCALE})`}>
        {hovered && (
          <path
            d={PATH}
            fill="none"
            stroke={HALO_DARK}
            strokeWidth={HALO_WIDTH + 2 * HALO_EDGE}
            {...stroke}
          />
        )}
        {/* OpenLayers only hits an icon's non-transparent pixels, so this
            backing keeps the cut-outs hoverable while still showing the map
            through them */}
        <path d={PATH} fill="#000" fillOpacity={HIT_BACKING_OPACITY} />
        <rect
          width={FLAG_WIDTH}
          height={FLAG_HEIGHT}
          fill={hovered ? colors.hoverStroke : colors.stroke}
          mask="url(#cut)"
        />
        <path
          d={PATH}
          fill="none"
          stroke={hovered ? HALO_LIGHT : colors.outline}
          strokeWidth={hovered ? HALO_WIDTH : 1.5}
          {...stroke}
        />
      </g>
    </svg>
  );
}
