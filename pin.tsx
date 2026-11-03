import type { ComponentType } from "react";
import type { ThemeColors } from "./hooks/useThemeColors";

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
    <svg width="24" height="32" viewBox="0 0 24 32">
      <path
        d="M12 1C5.9 1 1 5.9 1 12c0 8.3 11 19 11 19s11-10.7 11-19C23 5.9 18.1 1 12 1z"
        fill={color}
        stroke={colors.outline}
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" fill={colors.outline} />
    </svg>
  );
}
