import { useMemo } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { Map, View, TileLayer, VectorLayer } from "react-openlayers";
import { OSM } from "ol/source";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import "react-openlayers/dist/index.css";
import styles from "./geojson-map.module.css";

type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;

interface GeoJsonMapProps {
  data: GeoJsonData;
  center?: [number, number]; // [lon, lat]
  zoom?: number;
  height?: number;
  className?: string;
}

export function GeoJsonMap({
  data,
  center = [-79.0558, 35.9132],
  zoom = 11,
  height = 600,
  className,
}: GeoJsonMapProps) {
  const vectorSource = useMemo(
    () =>
      new VectorSource({
        features: new GeoJSON().readFeatures(data, {
          dataProjection: "EPSG:4326", // GeoJSON is lon/lat by spec
          featureProjection: "EPSG:3857", // the map's default projection
        }),
      }),
    [data],
  );

  return (
    <div
      className={`${styles.mapContainer} ${className || ""}`.trim()}
      style={{ width: "100%", height }}
    >
      <Map>
        <TileLayer source={new OSM()} />
        <VectorLayer source={vectorSource} />
        <View center={fromLonLat(center)} zoom={zoom} />
      </Map>
    </div>
  );
}
