import { useEffect, useState } from "react";
import type OLMap from "ol/Map";
import type { Coordinate } from "ol/coordinate";
import { getCenter } from "ol/extent";
import { unByKey } from "ol/Observable";
import { transformExtent } from "ol/proj";

// Space kept clear around `bounds` when fitting them, as around a selected
// feature (FIT_PADDING in feature-map.tsx), so an area sits in some context
// rather than filling the map edge to edge
const PADDING = 96;
// Within this of the last home view, the map counts as not moved yet
const ZOOM_TOLERANCE = 1e-3;
const CENTER_TOLERANCE_PX = 1;

export interface HomeView {
  center: Coordinate; // in the view's projection
  zoom: number;
}

// [west, south, east, north] in longitude and latitude
export type Bounds = [number, number, number, number];

const isAt = (map: OLMap, home: HomeView) => {
  const view = map.getView();
  const zoom = view.getZoom();
  const [x, y] = view.getCenter() ?? home.center;
  const resolution = view.getResolution() ?? 1;
  return (
    zoom !== undefined &&
    Math.abs(zoom - home.zoom) < ZOOM_TOLERANCE &&
    Math.hypot(x - home.center[0], y - home.center[1]) / resolution <
      CENTER_TOLERANCE_PX
  );
};

// The map's starting view, which the reset button returns to: `bounds` fitted
// to the map's size when given, as a fixed zoom crops them on small screens,
// else `center` and `zoom`. Refitted when the map is resized, moving the map
// along only if it hasn't been moved from the old fit. Follows the view
// through replacement, as react-openlayers' <View> sets a new one on the map.
export const useHomeView = (
  map: OLMap | null | undefined,
  center: Coordinate,
  zoom: number,
  bounds?: Bounds,
): HomeView => {
  const [fitted, setFitted] = useState<HomeView>();
  // A string, so a new array with the same bounds doesn't refit
  const boundsKey = bounds?.join(",");

  useEffect(() => {
    if (!map || !boundsKey) return;
    const lonLatExtent = boundsKey.split(",").map(Number);
    let home: HomeView | undefined;

    const fit = (move: boolean) => {
      const [width, height] = map.getSize() ?? [0, 0];
      if (!width || !height) return;
      const view = map.getView();
      const extent = transformExtent(
        lonLatExtent,
        "EPSG:4326",
        view.getProjection(),
      );
      const resolution = view.getResolutionForExtent(extent, [
        Math.max(1, width - 2 * PADDING),
        Math.max(1, height - 2 * PADDING),
      ]);
      const next = {
        center: getCenter(extent),
        zoom: view.getZoomForResolution(resolution) ?? zoom,
      };
      if (move) {
        view.setCenter(next.center);
        view.setZoom(next.zoom);
      }
      home = next;
      setFitted(next);
    };
    const onResize = () => fit(!home || isAt(map, home));

    fit(true);
    const keys = [
      map.on("change:view", () => fit(true)),
      map.on("change:size", onResize),
    ];
    return () => {
      unByKey(keys);
      setFitted(undefined);
    };
  }, [map, boundsKey, zoom]);

  return (bounds && fitted) || { center, zoom };
};
