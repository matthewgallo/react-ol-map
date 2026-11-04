import { HALO_EDGE, HALO_WIDTH } from "./halo";

// The default pin's teardrop, anchored at its tip
export const PATH =
  "M12 1C5.9 1 1 5.9 1 12c0 8.3 11 19 11 19s11-10.7 11-19C23 5.9 18.1 1 12 1z";
export const WIDTH = 24;
export const HEIGHT = 32;
const TIP_Y = 31;
// Room around the outline for the hovered halo, the same in both states so
// the pin doesn't shift when hovered
export const PAD = HALO_WIDTH / 2 + HALO_EDGE;

// The default pin's tip, as a fraction of its image, for the icon anchor
export const DEFAULT_PIN_ANCHOR: [number, number] = [
  0.5,
  (TIP_Y + PAD) / (HEIGHT + 2 * PAD),
];
