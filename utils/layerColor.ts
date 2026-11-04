import type { CSSProperties } from "react";
import type { MapColor } from "../types";

// Sets --layer-color to the layer's outline color (step 9 of its scale), for
// the swatch that ties a tooltip or details view to its layer, and
// --layer-tint to a soft wash of it (alpha step 3), for their header bands
export const layerColorStyle = (color: MapColor = "accent"): CSSProperties =>
  ({
    "--layer-color": `var(--${color}-9)`,
    "--layer-tint": `var(--${color}-a3)`,
  }) as CSSProperties;
