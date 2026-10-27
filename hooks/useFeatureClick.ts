import { useEffect } from "react";
import type OLMap from "ol/Map";
import type { MapBrowserEvent } from "ol";
import type { FeatureLike } from "ol/Feature";
import { pickFeatures } from "../utils/pickFeatures";

export const useFeatureClick = (
  map: OLMap | null | undefined,
  enabled: boolean,
  onSelect: (features: FeatureLike[]) => void,
) => {
  useEffect(() => {
    if (!map || !enabled) return;

    const onTap = (evt: MapBrowserEvent) => {
      const overControl = (
        evt.originalEvent.target as HTMLElement | null
      )?.closest(".ol-control");
      if (overControl) return;

      const hits = map.getFeaturesAtPixel(evt.pixel, { hitTolerance: 6 });
      const picked = pickFeatures(hits, evt.coordinate, 1);
      if (picked.length) onSelect(picked);
    };

    map.on("singleclick", onTap);
    return () => map.un("singleclick", onTap);
  }, [map, enabled, onSelect]);
};
