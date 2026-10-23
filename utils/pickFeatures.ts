import { Feature } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Coordinate } from "ol/coordinate";

export const pickFeatures = (
  candidates: FeatureLike[],
  coordinate: Coordinate,
  limit: number,
): FeatureLike[] => {
  // Prefer features that actually contain the cursor position
  const containing = candidates.filter(
    (f) =>
      f instanceof Feature && f.getGeometry()?.intersectsCoordinate(coordinate),
  );
  // Fall back to everything hit (cursor on a border stroke, or point/line features)
  const pool = containing.length ? containing : candidates;
  return pool.slice(0, limit);
};
