import type { FeatureLike } from "ol/Feature";
import type { Extent } from "ol/extent";
import VectorTileLayer from "ol/layer/VectorTile";
import { keyOf, type VectorBaseLayer } from "../types";

// A layer's features within `extent`, once each. Tile layers only have the
// features of the tiles they last drew, split into a piece per tile, so this
// keeps one piece of each; hidden ones have none.
export const featuresInView = (
  layer: VectorBaseLayer,
  extent: Extent,
): FeatureLike[] => {
  if (!layer.getVisible()) return [];
  if (!(layer instanceof VectorTileLayer)) {
    return layer.getSource()?.getFeaturesInExtent(extent) ?? [];
  }
  const seen = new Set<unknown>();
  return layer.getFeaturesInExtent(extent).filter((f) => {
    const key = keyOf(f);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
