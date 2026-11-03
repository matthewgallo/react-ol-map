import Feature from "ol/Feature";
import RenderFeature, { toGeometry } from "ol/render/Feature";
import type { Coordinate } from "ol/coordinate";
import type { FeatureLike } from "ol/Feature";
import { keyOf, type Hit } from "../types";

const geometryOf = (f: FeatureLike) =>
  f instanceof RenderFeature ? toGeometry(f) : (f as Feature).getGeometry();

// Picks the feature to hover or select from `hits`, ordered top-most first
export const pickHit = (
  hits: Hit[],
  coordinate: Coordinate,
): Hit | undefined => {
  // Prefer features that actually contain the cursor position, over neighbors
  // within the hit tolerance. Points only register a hit when the cursor is on
  // their symbol (e.g. a pin), so they count too, which keeps a pin ahead of
  // the area underneath it.
  const containing = hits.find(({ feature }) => {
    const geometry = geometryOf(feature);
    return (
      geometry?.getType() === "Point" ||
      geometry?.intersectsCoordinate(coordinate)
    );
  });
  // Fall back to the top-most hit (cursor on a border stroke, or a line)
  return containing ?? hits[0];
};

export const sameHit = (a: Hit | undefined, b: Hit | undefined) =>
  a === b ||
  (!!a &&
    !!b &&
    a.layerId === b.layerId &&
    keyOf(a.feature) === keyOf(b.feature));
