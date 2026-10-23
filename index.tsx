import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { Map, View, TileLayer, VectorLayer } from "react-openlayers";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { useTheme } from "next-themes";
import XYZ from "ol/source/XYZ";

const apiKey = import.meta.env.VITE_MAP_KEY;
const tileUrl = (dark: boolean) =>
  `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${apiKey}`;

const ATTRIBUTION = '© <a href="https://carto.com/attributions">CARTO</a>';

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

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [basemap] = useState(
    () =>
      new XYZ({ url: tileUrl(isDark), attributions: ATTRIBUTION, maxZoom: 20 }),
  );

  useEffect(() => {
    basemap.setUrl(tileUrl(isDark));
  }, [isDark, basemap]);

  return (
    <div
      className={`${styles.mapContainer} ${className || ""}`.trim()}
      style={{ width: "100%", height }}
    >
      <Map>
        <TileLayer source={basemap} />
        <VectorLayer source={vectorSource} />
        <View center={fromLonLat(center)} zoom={zoom} />
      </Map>
    </div>
  );
}
