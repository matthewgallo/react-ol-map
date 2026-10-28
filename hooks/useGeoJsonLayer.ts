import { useEffect, useMemo } from "react";
import type OLMap from "ol/Map";
import type { FeatureCollection } from "geojson";
import type { StyleLike } from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

// Owns the GeoJSON vector layer so its style can change after creation
// (react-openlayers' VectorLayer ignores prop updates)
export const useGeoJsonLayer = (
  map: OLMap | null | undefined,
  data: FeatureCollection | undefined,
  style: StyleLike,
) => {
  const layer = useMemo(
    () =>
      data
        ? new VectorLayer({
            source: new VectorSource({
              features: new GeoJSON().readFeatures(data, {
                dataProjection: "EPSG:4326",
                featureProjection: "EPSG:3857",
              }),
            }),
          })
        : undefined,
    [data],
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
};
