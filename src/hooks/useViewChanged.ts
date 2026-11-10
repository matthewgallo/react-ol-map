import { useEffect, useState } from "react";
import type OLMap from "ol/Map";
import type { Coordinate } from "ol/coordinate";
import type { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

// Zooms within this of each other count as the same, since animations and
// pinch gestures can settle a hair off the exact level
const ZOOM_TOLERANCE = 1e-3;
// Centers within this many screen pixels count as the same, so a slight
// accidental drag doesn't count as moving the map
const CENTER_TOLERANCE_PX = 24;

// Whether the map's view has moved from `center` (in the view's projection) or
// `zoom`. Follows the view through replacement, as react-openlayers' <View>
// sets a new one on the map.
export const useViewChanged = (
  map: OLMap | null | undefined,
  center: Coordinate,
  zoom: number,
  enabled = true,
) => {
  const [changed, setChanged] = useState(false);
  const [centerX, centerY] = center;

  useEffect(() => {
    if (!map || !enabled) return;

    let viewKeys: EventsKey[] = [];
    const update = () => {
      const view = map.getView();
      const current = view.getZoom();
      const [x, y] = view.getCenter() ?? [centerX, centerY];
      const resolution = view.getResolution() ?? 1;
      const zoomed =
        current !== undefined && Math.abs(current - zoom) > ZOOM_TOLERANCE;
      const panned =
        Math.hypot(x - centerX, y - centerY) / resolution > CENTER_TOLERANCE_PX;
      setChanged(zoomed || panned);
    };
    const watchView = () => {
      unByKey(viewKeys);
      viewKeys = [
        map.getView().on("change:resolution", update),
        map.getView().on("change:center", update),
      ];
      update();
    };

    watchView();
    const mapKey = map.on("change:view", watchView);
    return () => {
      unByKey(mapKey);
      unByKey(viewKeys);
      setChanged(false);
    };
  }, [map, centerX, centerY, zoom, enabled]);

  return enabled && changed;
};
