import type { ComponentType } from "react";
import type { ThemeColors } from "./hooks/useThemeColors";
import { HALO_DARK, HALO_EDGE, HALO_LIGHT, HALO_WIDTH } from "./utils/halo";
import { HEIGHT, PAD, PATH, WIDTH } from "./utils/pinGeometry";

export interface PinProps {
  hovered: boolean; // hovered, or selected while its dialog is open
  colors: ThemeColors; // current theme colors, since context isn't available
}

// Rendered once per state to a static SVG image, so it must render an <svg>
// with a width and height, and can't use context, effects or event handlers
export type PinComponent = ComponentType<PinProps>;

// Teardrop pin anchored at its tip
export function DefaultPin({
  hovered,
  colors,
  color = hovered ? colors.hoverStroke : colors.stroke,
}: PinProps & { color?: string }) {
  return (
    <svg
      width={WIDTH + 2 * PAD}
      height={HEIGHT + 2 * PAD}
      viewBox={`${-PAD} ${-PAD} ${WIDTH + 2 * PAD} ${HEIGHT + 2 * PAD}`}
    >
      {hovered && (
        <path
          d={PATH}
          fill="none"
          stroke={HALO_DARK}
          strokeWidth={HALO_WIDTH + 2 * HALO_EDGE}
          strokeLinejoin="round"
        />
      )}
      <path
        d={PATH}
        fill={color}
        stroke={hovered ? HALO_LIGHT : colors.outline}
        strokeWidth={hovered ? HALO_WIDTH : 2}
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill={hovered ? HALO_LIGHT : colors.outline}
        stroke={hovered ? HALO_DARK : undefined}
        strokeWidth={HALO_EDGE}
      />
    </svg>
  );
}
