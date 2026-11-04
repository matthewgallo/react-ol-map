import { useEffect, useState } from "react";
import type OLMap from "ol/Map";
import type { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

// Zooms within this of each other count as the same, since animations and
// pinch gestures can settle a hair off the exact level
const TOLERANCE = 1e-3;

// Whether the map's zoom differs from `zoom`. Follows the view through
// replacement, as react-openlayers' <View> sets a new one on the map.
export const useZoomChanged = (
  map: OLMap | null | undefined,
  zoom: number,
  enabled = true,
) => {
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!map || !enabled) return;

    let viewKey: EventsKey | undefined;
    const update = () => {
      const current = map.getView().getZoom();
      setChanged(current !== undefined && Math.abs(current - zoom) > TOLERANCE);
    };
    const watchView = () => {
      if (viewKey) unByKey(viewKey);
      viewKey = map.getView().on("change:resolution", update);
      update();
    };

    watchView();
    const mapKey = map.on("change:view", watchView);
    return () => {
      unByKey(mapKey);
      if (viewKey) unByKey(viewKey);
      setChanged(false);
    };
  }, [map, zoom, enabled]);

  return enabled && changed;
};
