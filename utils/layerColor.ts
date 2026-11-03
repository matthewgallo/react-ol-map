import type { CSSProperties } from "react";
import type { MapColor } from "../types";

// Sets --layer-color to the layer's outline color (step 9 of its scale), for
// the swatch and edge that tie a tooltip or details view to its layer
export const layerColorStyle = (color: MapColor = "accent"): CSSProperties =>
  ({ "--layer-color": `var(--${color}-9)` }) as CSSProperties;
