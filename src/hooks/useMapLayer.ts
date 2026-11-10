import { useEffect } from "react";
import type OLMap from "ol/Map";
import type BaseLayer from "ol/layer/Base";

// Adds `layer` to the map while mounted, and keeps its stacking order and
// visibility in sync. Hidden layers are also skipped by hit detection.
export const useMapLayer = (
  map: OLMap | null | undefined,
  layer: BaseLayer | undefined,
  zIndex = 0,
  visible = true,
) => {
  useEffect(() => {
    if (!map || !layer) return;
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, layer]);

  useEffect(() => {
    layer?.setZIndex(zIndex);
  }, [layer, zIndex]);

  useEffect(() => {
    layer?.setVisible(visible);
  }, [layer, visible]);
};
