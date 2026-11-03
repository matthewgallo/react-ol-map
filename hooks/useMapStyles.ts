import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import { useThemeColors } from "./useThemeColors";

// Teardrop pin anchored at its tip
const pinIcon = (fill: string, outline: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path d="M12 1C5.9 1 1 5.9 1 12c0 8.3 11 19 11 19s11-10.7 11-19C23 5.9 18.1 1 12 1z" fill="${fill}" stroke="${outline}" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="${outline}"/></svg>`,
  )}`;

// Feature styles that follow the Radix accent color and light/dark appearance
export const useMapStyles = () => {
  const colors = useThemeColors();

  return useMemo(
    () => ({
      base: new Style({
        fill: new Fill({ color: colors.fill }),
        stroke: new Stroke({ color: colors.stroke, width: 1.25 }),
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: colors.stroke }),
          stroke: new Stroke({ color: colors.outline, width: 1.5 }),
        }),
      }),
      hover: new Style({
        fill: new Fill({ color: colors.hoverFill }),
        stroke: new Stroke({ color: colors.hoverStroke, width: 3 }),
        image: new Circle({
          radius: 7,
          fill: new Fill({ color: colors.hoverStroke }),
          stroke: new Stroke({ color: colors.outline, width: 2 }),
        }),
        zIndex: 1,
      }),
      pin: new Style({
        image: new Icon({
          src: pinIcon(colors.stroke, colors.outline),
          anchor: [0.5, 1],
        }),
      }),
      pinHover: new Style({
        image: new Icon({
          src: pinIcon(colors.hoverStroke, colors.outline),
          anchor: [0.5, 1],
          scale: 1.25,
        }),
        zIndex: 1,
      }),
    }),
    [colors],
  );
};
