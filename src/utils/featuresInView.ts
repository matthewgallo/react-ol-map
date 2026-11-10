import type { FeatureLike } from "ol/Feature";
import type { Extent } from "ol/extent";
import VectorTileLayer from "ol/layer/VectorTile";
import Cluster from "ol/source/Cluster";
import { keyOf, type VectorBaseLayer } from "../types";

// Whether the layer's style draws `feature` at `resolution`. A style
// function returns nothing for features it hides, such as a layer's filter.
const isDrawn = (
  layer: VectorBaseLayer,
  feature: FeatureLike,
  resolution: number,
) => {
  const style = layer.getStyleFunction()?.(feature, resolution);
  return Array.isArray(style) ? style.length > 0 : !!style;
};

// A layer's features drawn within `extent`, once each. Tile layers only have
// the features of the tiles they last drew, split into a piece per tile, so
// this keeps one piece of each; hidden ones have none. Clustered layers give
// the points themselves, rather than the clusters they're drawn as.
export const featuresInView = (
  layer: VectorBaseLayer,
  extent: Extent,
  resolution: number,
): FeatureLike[] => {
  if (!layer.getVisible()) return [];
  const drawn = (f: FeatureLike) => isDrawn(layer, f, resolution);
  if (!(layer instanceof VectorTileLayer)) {
    const source = layer.getSource();
    const points = source instanceof Cluster ? source.getSource() : source;
    return (points?.getFeaturesInExtent(extent) ?? []).filter(drawn);
  }
  const seen = new Set<unknown>();
  return layer.getFeaturesInExtent(extent).filter((f) => {
    if (!drawn(f)) return false;
    const key = keyOf(f);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
