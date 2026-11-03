import { Feature } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Coordinate } from "ol/coordinate";

export const pickFeatures = (
  candidates: FeatureLike[],
  coordinate: Coordinate,
  limit: number,
): FeatureLike[] => {
  // Prefer features that actually contain the cursor position. Points only
  // register a hit when the cursor is on their symbol (e.g. a pin), so they
  // count too, which keeps a pin ahead of the area underneath it.
  const containing = candidates.filter((f) => {
    if (!(f instanceof Feature)) return false;
    const geometry = f.getGeometry();
    return (
      geometry?.getType() === "Point" ||
      geometry?.intersectsCoordinate(coordinate)
    );
  });
  // Fall back to everything hit (cursor on a border stroke, or point/line features)
  const pool = containing.length ? containing : candidates;
  const seen = new Set();
  const unique = pool.filter((f) => {
    const id = f.getId();
    if (id === undefined) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  return unique.slice(0, limit);
};
