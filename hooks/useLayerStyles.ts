import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import { useThemeColors } from "./useThemeColors";
import { DefaultPin, type PinComponent } from "../pin";
import { DEFAULT_PIN_ANCHOR } from "../utils/pinGeometry";
import { pinToSrc } from "../utils/pinToSrc";
import { HALO_DARK, HALO_EDGE, HALO_LIGHT, HALO_WIDTH } from "../utils/halo";
import type { MapColor } from "../types";

const HOVER_SCALE = 1.25;
const DOT_RADIUS = 5; // a hovered dot's color, inside its rings

// A filled circle, for stacking into a ringed dot
const dot = (radius: number, color: string) =>
  new Circle({ radius, declutterMode: "none", fill: new Fill({ color }) });

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
      // Areas and lines get the halo outline (see utils/halo). Dots get it as
      // rings, stacked as circles from the outside in: black edge, white
      // line, black edge, then the color.
      hover: [
        new Style({
          fill: new Fill({ color: colors.hoverFill }),
          stroke: new Stroke({
            color: HALO_DARK,
            width: HALO_WIDTH + 2 * HALO_EDGE,
          }),
          image: dot(DOT_RADIUS + 2 * HALO_EDGE + HALO_WIDTH, HALO_DARK),
        }),
        new Style({
          stroke: new Stroke({ color: HALO_LIGHT, width: HALO_WIDTH }),
          image: dot(DOT_RADIUS + HALO_EDGE + HALO_WIDTH, HALO_LIGHT),
        }),
        new Style({ image: dot(DOT_RADIUS + HALO_EDGE, HALO_DARK) }),
        new Style({ image: dot(DOT_RADIUS, colors.hoverStroke) }),
      ],
    }),
    [colors],
  );
};

// Pin styles rendered from `Pin`. `anchor` is the fraction of the pin image
// placed on the point.
export const usePinStyles = (
  Pin: PinComponent = DefaultPin,
  anchor?: [number, number],
  color: MapColor = "accent",
) => {
  const colors = useThemeColors(color);
  // The default pin knows where its tip is; other pins default to bottom center
  const [anchorX, anchorY] =
    anchor ?? (Pin === DefaultPin ? DEFAULT_PIN_ANCHOR : [0.5, 1]);

  return useMemo(() => {
    const icon = (hovered: boolean) =>
      new Icon({
        src: pinToSrc(Pin, { hovered, colors }),
        anchor: [anchorX, anchorY],
        scale: hovered ? HOVER_SCALE : 1,
      });
    return {
      base: new Style({ image: icon(false) }),
      hover: [new Style({ image: icon(true) })],
    };
  }, [colors, Pin, anchorX, anchorY]);
};
