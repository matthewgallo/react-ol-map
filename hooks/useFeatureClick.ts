import { useEffect } from "react";
import type OLMap from "ol/Map";
import type { MapBrowserEvent } from "ol";
import type { Pixel } from "ol/pixel";
import type { Coordinate } from "ol/coordinate";
import type { Hit } from "../types";

// Calls `onClick` with the clicked feature, or undefined on empty map
export const useFeatureClick = (
  map: OLMap | null | undefined,
  hitAt: (pixel: Pixel, coordinate: Coordinate) => Hit | undefined,
  onClick: (hit: Hit | undefined) => void,
) => {
  useEffect(() => {
    if (!map) return;

    const onTap = (evt: MapBrowserEvent) => {
      const overControl = (
        evt.originalEvent.target as HTMLElement | null
      )?.closest(".ol-control");
      if (overControl) return;
      onClick(hitAt(evt.pixel, evt.coordinate));
    };

    map.on("singleclick", onTap);
    return () => map.un("singleclick", onTap);
  }, [map, hitAt, onClick]);
};
