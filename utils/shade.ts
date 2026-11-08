// Shading areas by a numeric property: a fill whose opacity steps up with
// the value, like a choropleth in one color. Stepped rather than continuous,
// so counts skewed toward a few large values still spread across the scale.

// Shades a layer's areas by the number in `key`. `steps` are the ascending
// lower bounds of each class above the first: [1, 2, 5] makes the classes
// below 1, 1, 2–4 and 5 and up.
export interface Shade {
  key: string;
  steps: number[];
  // The lowest class means none, such as no organizations, so it's drawn
  // nearly empty rather than as the faintest shade
  emptyLowest?: boolean;
  // Areas without a value are hatched, as having no data, and the legend
  // gets an entry for them. Otherwise they're drawn in the lowest class.
  noData?: boolean;
}

// Fill opacity of an empty lowest class, so its areas still read as part of
// the layer, and of the shaded classes, from the faintest to the strongest
const EMPTY_ALPHA = 0.04;
const MIN_ALPHA = 0.15;
const MAX_ALPHA = 0.8;

// Whether `value` is a number to shade by: a number, or a numeric string as
// tile properties can be
export const hasValue = (value: unknown): boolean =>
  value != null && value !== "" && !Number.isNaN(Number(value));

// Which class `value` falls in: 0 below the first step, steps.length at or
// above the last. Missing and non-numeric values go in the lowest.
export const shadeClass = (value: unknown, steps: number[]): number => {
  if (!hasValue(value)) return 0;
  const n = Number(value);
  let cls = 0;
  while (cls < steps.length && n >= steps[cls]) cls++;
  return cls;
};

// The fill opacity of each class, lowest first
export const shadeAlphas = (steps: number[], emptyLowest = false): number[] => {
  const shaded = emptyLowest ? steps.length : steps.length + 1;
  const alphas = Array.from({ length: shaded }, (_, i) =>
    shaded === 1
      ? MAX_ALPHA
      : MIN_ALPHA + ((MAX_ALPHA - MIN_ALPHA) * i) / (shaded - 1),
  );
  return emptyLowest ? [EMPTY_ALPHA, ...alphas] : alphas;
};

// A class of values and its fill opacity: from `min` (none for the lowest)
// up to but not including `below` (none for the highest)
export interface ShadeClass {
  min?: number;
  below?: number;
  alpha: number;
}

// Every class of `shade`, lowest first, for a legend matching the map
export const shadeClasses = ({ steps, emptyLowest }: Shade): ShadeClass[] =>
  shadeAlphas(steps, emptyLowest).map((alpha, i) => ({
    min: i > 0 ? steps[i - 1] : undefined,
    below: i < steps.length ? steps[i] : undefined,
    alpha,
  }));

// A class's range for counts, which are whole numbers from 0: "0", "2–4" or
// "13+", each number written by `format`
export const formatCountRange = (
  { min = 0, below }: ShadeClass,
  format: (n: number) => string = String,
): string => {
  if (below == null) return `${format(min)}+`;
  const max = Math.ceil(below) - 1;
  return max <= min ? format(min) : `${format(min)}–${format(max)}`;
};

// A class's range by its bounds, for large or rounded values written
// compactly: "< 10K", "10K–50K" or "250K+", each number written by `format`
export const formatBoundsRange = (
  { min, below }: ShadeClass,
  format: (n: number) => string = String,
): string => {
  if (min == null) return below == null ? "" : `< ${format(below)}`;
  if (below == null) return `${format(min)}+`;
  return `${format(min)}–${format(below)}`;
};

// `color` at opacity `alpha`: an rgba() color, as useThemeColors returns it,
// or a hex one, as its fallbacks are. Others are returned as they are.
export const withAlpha = (color: string, alpha: number): string => {
  const a = +alpha.toFixed(3);
  const rgb = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${a})`;
  const hex = color.match(/^#([\da-f]{6})(?:[\da-f]{2})?$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  return color;
};
