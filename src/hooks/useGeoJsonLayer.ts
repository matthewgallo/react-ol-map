import { useEffect, useMemo } from "react";
import type { FeatureCollection } from "geojson";
import type Feature from "ol/Feature";
import type { Point } from "ol/geom";
import type { StyleLike } from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { DEFAULT_CLUSTER_DISTANCE } from "../utils/cluster";
import type { ClusterOption, FeatureFilter } from "../types";

// Only points can cluster; returning null leaves other geometry out
const pointOf = (feature: Feature) => {
  const geometry = feature.getGeometry();
  return geometry?.getType() === "Point" ? (geometry as Point) : null;
};

// Creates a vector layer for `data`, rebuilt only when the data changes or
// clustering is turned on or off. The style is set afterwards, so a theme
// change restyles it without a rebuild. Add it to the map with useMapLayer
// (InteractiveLayer does this).
//
// With `cluster`, nearby points are grouped by a Cluster source around the
// `filter`ed points, since a style can only hide a whole cluster. Without it,
// `filter` is left to the style (see useFilteredStyles).
export const useGeoJsonLayer = (
  data: FeatureCollection | undefined,
  style: StyleLike,
  cluster?: ClusterOption,
  filter?: FeatureFilter,
) => {
  const clustered = !!cluster;
  const { distance = DEFAULT_CLUSTER_DISTANCE, minDistance = 0 } =
    typeof cluster === "object" ? cluster : {};

  const features = useMemo(
    () =>
      data &&
      new GeoJSON().readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      }),
    [data],
  );

  const layer = useMemo(
    () =>
      features
        ? new VectorLayer({
            source: clustered
              ? new Cluster({ geometryFunction: pointOf })
              : new VectorSource({ features }),
          })
        : undefined,
    [features, clustered],
  );

  useEffect(() => {
    const source = layer?.getSource();
    if (!features || !(source instanceof Cluster)) return;
    source.setSource(
      new VectorSource({
        features: filter
          ? features.filter((f) => filter(f.getProperties()))
          : features,
      }),
    );
  }, [layer, features, filter]);

  useEffect(() => {
    const source = layer?.getSource();
    if (!(source instanceof Cluster)) return;
    source.setDistance(distance);
    source.setMinDistance(minDistance);
  }, [layer, distance, minDistance]);

  useEffect(() => {
    layer?.setStyle(style);
  }, [layer, style]);

  return layer;
};
