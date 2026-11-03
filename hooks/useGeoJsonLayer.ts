import { useEffect, useMemo } from "react";
import type OLMap from "ol/Map";
import type { FeatureCollection } from "geojson";
import type { StyleLike } from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

// Owns the GeoJSON vector layer so its style can change after creation
// (react-openlayers' VectorLayer ignores prop updates). Higher zIndex layers
// draw on top, which is how datasets are overlaid.
export const useGeoJsonLayer = (
  map: OLMap | null | undefined,
  data: FeatureCollection | undefined,
  style: StyleLike,
  zIndex?: number,
  visible = true,
) => {
  const layer = useMemo(
    () =>
      data
        ? new VectorLayer({
            zIndex,
            source: new VectorSource({
              features: new GeoJSON().readFeatures(data, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
              }),
            }),
          })
        : undefined,
    [data, zIndex],
  );

  useEffect(() => {
    if (!map || !layer) return;
    map.addLayer(layer);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, layer]);

  useEffect(() => {
    layer?.setStyle(style);
  }, [layer, style]);

  // Hidden layers are also skipped by hit detection (hover, tooltips, taps)
  useEffect(() => {
    layer?.setVisible(visible);
  }, [layer, visible]);

  return layer;
};
