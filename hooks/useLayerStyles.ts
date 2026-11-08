import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import type { StyleFunction, StyleLike } from "ol/style/Style";
import { useThemeColors } from "./useThemeColors";
import { DefaultPin, type PinComponent } from "../pin";
import { DEFAULT_PIN_ANCHOR } from "../utils/pinGeometry";
import { pinToSrc } from "../utils/pinToSrc";
import { HALO_DARK, HALO_EDGE, HALO_LIGHT, HALO_WIDTH } from "../utils/halo";
import { hatchPattern } from "../utils/hatch";
import {
  hasValue,
  shadeAlphas,
  shadeClass,
  withAlpha,
  type Shade,
} from "../utils/shade";
import type { FeatureFilter, MapColor } from "../types";

const HOVER_SCALE = 1.25;
const DOT_RADIUS = 5; // a hovered dot's color, inside its rings

// A filled circle, for stacking into a ringed dot
const dot = (radius: number, color: string) =>
  new Circle({ radius, declutterMode: "none", fill: new Fill({ color }) });

// Shape styles in a Radix color that follow the light/dark appearance. Points
// in an area layer are drawn as dots. `nested` areas, drawn within another
// layer's, get a stronger fill and border to stand out from it and each other.
// With `shade`, each area's fill opacity steps up with its value (see
// utils/shade), in place of the even fill, and areas without a value are
// hatched with its `noData`. Without `fill`, areas are drawn
// as outlines only, hovered and selected ones too.
//
// The dots set declutterMode "none" so they can be hovered and clicked in
// vector tile layers. When decluttering is off, OpenLayers (10.11) still
// filters tile hit detection against an empty decluttered-feature list, which
// silently drops image-styled points unless their declutterMode is "none".
// The layers don't declutter, so this doesn't change how the dots render.
export const useAreaStyles = (
  color: MapColor = "accent",
  nested = false,
  shade?: Shade,
  fill = true,
) => {
  const colors = useThemeColors(color);
  // Compared by value, so a shade written inline doesn't restyle the layer
  const shadeKey = shade?.key;
  const shadeSteps = shade?.steps.join(",");
  const emptyLowest = shade?.emptyLowest;
  const noData = shade?.noData;

  return useMemo(() => {
    const style = (fillColor: string | CanvasPattern) =>
      new Style({
        fill: fill ? new Fill({ color: fillColor }) : undefined,
        stroke: new Stroke({ color: colors.stroke, width: nested ? 2 : 1.25 }),
        image: new Circle({
          radius: 5,
          declutterMode: "none",
          fill: new Fill({ color: colors.stroke }),
          stroke: new Stroke({ color: colors.outline, width: 1.5 }),
        }),
      });

    let base: StyleLike = style(nested ? colors.nestedFill : colors.fill);
    if (shadeKey != null && shadeSteps != null) {
      const steps = shadeSteps.split(",").filter(Boolean).map(Number);
      const classes = shadeAlphas(steps, emptyLowest).map((alpha) =>
        style(withAlpha(colors.stroke, alpha)),
      );
      const noDataStyle =
        noData &&
        style(hatchPattern(colors.stroke, withAlpha(colors.stroke, 0.04)));
      base = (feature) => {
        const value = feature.get(shadeKey);
        return noDataStyle && !hasValue(value)
          ? noDataStyle
          : classes[shadeClass(value, steps)];
      };
    }

    return {
      base,
      // Areas and lines get the halo outline (see utils/halo). Dots get it as
      // rings, stacked as circles from the outside in: black edge, white
      // line, black edge, then the color.
      hover: [
        new Style({
          fill: fill ? new Fill({ color: colors.hoverFill }) : undefined,
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
    };
  }, [colors, nested, shadeKey, shadeSteps, emptyLowest, noData, fill]);
};

// A layer's style, and the style of its hovered and selected features
export interface LayerStyles {
  base: StyleLike;
  hover: Style[];
}

// `styles` with its base style drawing only the features `filter` accepts.
// Features it rejects get no style, so they aren't drawn or hit-detected.
export const useFilteredStyles = (
  styles: LayerStyles,
  filter: FeatureFilter | undefined,
): LayerStyles =>
  useMemo(() => {
    if (!filter) return styles;
    const { base, hover } = styles;
    const style: StyleFunction = (feature, resolution) =>
      filter(feature.getProperties())
        ? typeof base === "function"
          ? base(feature, resolution)
          : base
        : undefined;
    return { base: style, hover };
  }, [styles, filter]);

// Pin styles rendered from `Pin`. `anchor` is the fraction of the pin image
// placed on the point. declutterMode "none" keeps pins hoverable and
// clickable in vector tile layers, as for the dots in useAreaStyles.
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
        declutterMode: "none",
      });
    return {
      base: new Style({ image: icon(false) }),
      hover: [new Style({ image: icon(true) })],
    };
  }, [colors, Pin, anchorX, anchorY]);
};
