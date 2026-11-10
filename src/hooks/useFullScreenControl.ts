import { useEffect } from "react";
import type OLMap from "ol/Map";
import FullScreen from "ol/control/FullScreen";

// The same OpenLayers control react-openlayers' <FullScreenControl> adds, but
// removed on cleanup so it can be re-created when the (translated) label changes
export const useFullScreenControl = (
  map: OLMap | null | undefined,
  enabled: boolean,
  tipLabel: string,
) => {
  useEffect(() => {
    if (!map || !enabled) return;
    const control = new FullScreen({ tipLabel });
    map.addControl(control);
    return () => {
      map.removeControl(control);
    };
  }, [map, enabled, tipLabel]);
};
