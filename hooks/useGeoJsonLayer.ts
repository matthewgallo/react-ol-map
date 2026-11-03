import { useEffect, useMemo } from "react";
import type { FeatureCollection } from "geojson";
import type { StyleLike } from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

// Creates a vector layer for `data`, rebuilt only when the data changes. The
// style is set afterwards, so a theme change restyles it without a rebuild.
// Add it to the map with useMapLayer (InteractiveLayer does this).
export const useGeoJsonLayer = (
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
    layer?.setStyle(style);
  }, [layer, style]);

  return layer;
};
