import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import { useThemeColors } from "./useThemeColors";
import { DefaultPin, type PinComponent } from "../pin";
import { pinToSrc } from "../utils/pinToSrc";
import type { MapColor } from "../types";

const HOVER_SCALE = 1.25;

// Shape styles in a Radix color that follow the light/dark appearance. Points
// in an area layer are drawn as dots.
//
// The dots set declutterMode "none" so they can be hovered and clicked in
// vector tile layers. When decluttering is off, OpenLayers (10.11) still
// filters tile hit detection against an empty decluttered-feature list, which
// silently drops image-styled points unless their declutterMode is "none".
// The layers don't declutter, so this doesn't change how the dots render.
export const useAreaStyles = (color: MapColor = "accent") => {
  const colors = useThemeColors(color);

  return useMemo(
    () => ({
      base: new Style({
        fill: new Fill({ color: colors.fill }),
        stroke: new Stroke({ color: colors.stroke, width: 1.25 }),
        image: new Circle({
          radius: 5,
          declutterMode: "none",
          fill: new Fill({ color: colors.stroke }),
          stroke: new Stroke({ color: colors.outline, width: 1.5 }),
        }),
      }),
      hover: new Style({
        fill: new Fill({ color: colors.hoverFill }),
        stroke: new Stroke({ color: colors.hoverStroke, width: 3 }),
        image: new Circle({
          radius: 7,
          declutterMode: "none",
          fill: new Fill({ color: colors.hoverStroke }),
          stroke: new Stroke({ color: colors.outline, width: 2 }),
        }),
      }),
    }),
    [colors],
  );
};

// Pin styles rendered from `Pin`. `anchor` is the fraction of the pin image
// placed on the point.
export const usePinStyles = (
  Pin: PinComponent = DefaultPin,
  anchor: [number, number] = [0.5, 1],
  color: MapColor = "accent",
) => {
  const colors = useThemeColors(color);
  const [anchorX, anchorY] = anchor;

  return useMemo(() => {
    const icon = (hovered: boolean) =>
      new Icon({
        src: pinToSrc(Pin, { hovered, colors }),
        anchor: [anchorX, anchorY],
        scale: hovered ? HOVER_SCALE : 1,
      });
    return {
      base: new Style({ image: icon(false) }),
      hover: new Style({ image: icon(true) }),
    };
  }, [colors, Pin, anchorX, anchorY]);
};
