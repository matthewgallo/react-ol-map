import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style, Text } from "ol/style";
import type { StyleFunction, StyleLike } from "ol/style/Style";
import { useThemeColors } from "./useThemeColors";
import { DefaultPin, type PinComponent } from "../pin";
import { DEFAULT_PIN_ANCHOR } from "../utils/pinGeometry";
import { pinToSrc } from "../utils/pinToSrc";
import { clusterMembers } from "../utils/cluster";
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
  hover: StyleLike;
}

const CLUSTER_RADIUS = 14; // a badge of up to 9 points
const CLUSTER_RADIUS_PER_DIGIT = 3; // room for each further digit
const CLUSTER_RING = 5; // the soft ring around a badge

// Canvas text can't inherit from the page, so a badge's count reads the app's
// font from the Theme root
const clusterFont = () => {
  const root =
    document.querySelector(".radix-themes") ?? document.documentElement;
  const family = getComputedStyle(root)
    .getPropertyValue("--default-font-family")
    .trim();
  return `600 12px ${family || "system-ui, sans-serif"}`;
};

const clusterRadius = (count: number) =>
  CLUSTER_RADIUS + CLUSTER_RADIUS_PER_DIGIT * (String(count).length - 1);

const countLabel = (count: number, color: string, font: string) =>
  new Text({
    text: String(count),
    font,
    fill: new Fill({ color }),
  });

// `styles` for a clustered layer: clusters of several points draw as a badge
// in the layer's color with their count, and clusters of one in the layer's
// own style. Badges use the color's solid step and its contrast color, so the
// count stays legible on every scale, in light and dark. Hovered badges get
// the same rings as dots (see useAreaStyles).
export const useClusterStyles = (
  styles: LayerStyles,
  clustered: boolean,
  color: MapColor = "accent",
): LayerStyles => {
  const colors = useThemeColors(color);

  return useMemo(() => {
    if (!clustered) return styles;

    const font = clusterFont();
    const badge = (count: number) => {
      const radius = clusterRadius(count);
      return [
        new Style({
          image: dot(radius + CLUSTER_RING, withAlpha(colors.stroke, 0.3)),
        }),
        new Style({
          image: new Circle({
            radius,
            fill: new Fill({ color: colors.stroke }),
            stroke: new Stroke({ color: colors.outline, width: 2 }),
          }),
          text: countLabel(count, colors.contrast, font),
        }),
      ];
    };
    const hoveredBadge = (count: number) => {
      const radius = clusterRadius(count);
      return [
        new Style({ image: dot(radius + 2 * HALO_EDGE + HALO_WIDTH, HALO_DARK) }),
        new Style({ image: dot(radius + HALO_EDGE + HALO_WIDTH, HALO_LIGHT) }),
        new Style({ image: dot(radius + HALO_EDGE, HALO_DARK) }),
        new Style({
          image: dot(radius, colors.hoverStroke),
          // Step 11 flips with the appearance, as the panel color does
          text: countLabel(count, colors.outline, font),
        }),
      ];
    };

    // Each count's badge is built once and shared between its clusters
    const withClusters = (
      plain: StyleLike,
      draw: (count: number) => Style[],
    ): StyleFunction => {
      const badges = new Map<number, Style[]>();
      return (feature, resolution) => {
        const members = clusterMembers(feature);
        if (members && members.length > 1) {
          const count = members.length;
          if (!badges.has(count)) badges.set(count, draw(count));
          return badges.get(count);
        }
        return typeof plain === "function"
          ? plain(members?.[0] ?? feature, resolution)
          : plain;
      };
    };

    return {
      base: withClusters(styles.base, badge),
      hover: withClusters(styles.hover, hoveredBadge),
    };
  }, [styles, clustered, colors]);
};

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
