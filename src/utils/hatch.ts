// The "no data" fill for shaded areas: thin diagonal lines in the layer's
// color, sparse enough to read as empty but unlike any shade

const SPACING = 6; // px between lines, in CSS pixels
const LINE_WIDTH = 1;
// Opacity of the lines, as a percentage for CSS
export const HATCH_ALPHA = 0.5;

// For OpenLayers fills: a repeating canvas pattern of `color` lines, at the
// screen's pixel density so they stay crisp. Falls back to a plain faint
// `fallback` where canvas isn't available, as in tests.
export const hatchPattern = (
  color: string,
  fallback: string,
): CanvasPattern | string => {
  const ratio = Math.max(1, Math.round(globalThis.devicePixelRatio || 1));
  const size = SPACING * ratio;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    // jsdom without a canvas implementation throws rather than returning null
  }
  if (!ctx) return fallback;
  ctx.strokeStyle = color;
  ctx.globalAlpha = HATCH_ALPHA;
  ctx.lineWidth = LINE_WIDTH * ratio;
  // A diagonal through the tile, and the two corners that continue it into
  // the neighboring tiles, so the lines join up across the pattern
  ctx.beginPath();
  for (const offset of [-size, 0, size]) {
    ctx.moveTo(offset, size);
    ctx.lineTo(offset + size, 0);
  }
  ctx.stroke();
  return ctx.createPattern(canvas, "repeat") ?? fallback;
};

// The same hatch as a CSS background, for legend swatches
export const hatchBackground = (color: string): string =>
  `repeating-linear-gradient(-45deg, color-mix(in srgb, ${color} ${
    HATCH_ALPHA * 100
  }%, transparent) 0 ${LINE_WIDTH}px, transparent ${LINE_WIDTH}px ${
    SPACING / Math.SQRT2
  }px)`;
