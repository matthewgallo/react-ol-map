import type { ReactNode } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import type { FeatureLike } from "ol/Feature";
import type VectorLayer from "ol/layer/Vector";
import type VectorTileLayer from "ol/layer/VectorTile";
import type { ThemeProps } from "@radix-ui/themes";

export type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;

export type FeatureProps = Record<string, unknown>;

// Tooltip and details content for the hovered or selected features
export type Render = (features: FeatureProps[]) => ReactNode;

// Whether a layer draws a feature, from its properties
export type FeatureFilter = (props: FeatureProps) => boolean;

// A Radix color scale, or "accent" to follow the theme's accent color
export type MapColor = NonNullable<ThemeProps["accentColor"]> | "accent";

// The OpenLayers layers an InteractiveLayer can make interactive
export type VectorBaseLayer = VectorLayer | VectorTileLayer;

// A feature under the pointer, and the InteractiveLayer that drew it
export interface Hit {
  layerId: string;
  feature: FeatureLike;
}

// Options shared by every layer component
export interface LayerProps {
  // Names the layer in the map's hover and selection (Hit.layerId), for
  // components that act on them. Unique within the map; generated if unset.
  id?: string;
  title?: string; // details heading when one of its features is selected
  renderTooltip?: Render; // shown on hover
  renderDialog?: Render; // shown on click; defaults to renderTooltip
  visible?: boolean;
  // false makes the layer display-only: no hover, tooltip or click, and
  // features beneath it can be picked through it
  interactive?: boolean;
  // Higher draws on top. Layers with the same zIndex draw in the order they
  // were added, so set it when the order matters.
  zIndex?: number;
  // zIndex of the hovered and selected highlight. Defaults to 10 above
  // zIndex, over the other area layers; set it lower to keep layers drawn
  // within this one's areas (such as a county's divisions) above it.
  highlightZIndex?: number;
  color?: MapColor;
  // Draws only the features it accepts. The others can't be hovered or
  // clicked, and are left out of useLayerFeatures. Define it outside render
  // or memoize it, since a new function restyles the layer.
  filter?: FeatureFilter;
}

export const toProps = (feature: FeatureLike): FeatureProps => {
  const props = { ...feature.getProperties() };
  delete props.geometry; // getProperties() includes the geometry itself
  return props;
};

// Identifies a feature within its layer. Tile features are clipped into a
// separate piece per tile, so they're matched by id rather than by object.
export const keyOf = (feature: FeatureLike): unknown =>
  feature.getId() ?? feature;
