import type { FeatureLike } from "ol/Feature";
import type { Coordinate } from "ol/coordinate";
import { buffer, type Extent } from "ol/extent";
import { featuresInView } from "./featuresInView";
import { keyOf, type VectorBaseLayer } from "../types";

// A point feature's coordinate; undefined for other geometry
const pointOf = (feature: FeatureLike): Coordinate | undefined => {
  const geometry = feature.getGeometry();
  if (geometry?.getType() !== "Point") return undefined;
  // Both a Point and a tile's RenderFeature keep their flat coordinates
  const flat = (
    geometry as unknown as { getFlatCoordinates(): number[] }
  ).getFlatCoordinates();
  return [flat[0], flat[1]];
};

// `feature` and the layer's other drawn points within a pixel of it, which
// draw on top of each other, such as schools sharing a campus. `feature`
// comes first. Other geometry is returned alone.
export const featuresAtPoint = (
  layer: VectorBaseLayer,
  feature: FeatureLike,
  resolution: number,
): FeatureLike[] => {
  const point = pointOf(feature);
  if (!point) return [feature];
  const [x, y] = point;
  const extent: Extent = buffer([x, y, x, y], resolution);
  const key = keyOf(feature);
  const others = featuresInView(layer, extent, resolution).filter((f) => {
    const p = keyOf(f) !== key && pointOf(f);
    return !!p && Math.hypot(p[0] - x, p[1] - y) <= resolution;
  });
  return [feature, ...others];
};
