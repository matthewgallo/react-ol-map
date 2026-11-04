import { useEffect, useState } from "react";
import type { FeatureLike } from "ol/Feature";
import { useFeatureMap } from "../context";
import { keyOf } from "../types";

const sameFeatures = (a: FeatureLike[], b: FeatureLike[]) =>
  a.length === b.length && a.every((f, i) => keyOf(f) === keyOf(b[i]));

// The features a layer draws in view (see featuresInView), kept up to date as
// the map moves and tiles load. For layers shown in a FeatureMap by `id`.
export const useLayerFeatures = (layerId: string): FeatureLike[] => {
  const { map, featuresOf } = useFeatureMap();
  const [features, setFeatures] = useState<FeatureLike[]>([]);

  useEffect(() => {
    if (!map) return;
    const update = () => {
      const next = featuresOf(layerId);
      setFeatures((prev) => (sameFeatures(prev, next) ? prev : next));
    };
    update();
    // After every render that loaded what it needed, including new tiles
    map.on("rendercomplete", update);
    return () => map.un("rendercomplete", update);
  }, [map, featuresOf, layerId]);

  return features;
};
