import { useEffect, useMemo, useState, useRef } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { Map, View, TileLayer, VectorLayer } from "react-openlayers";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { useTheme } from "next-themes";
import XYZ from "ol/source/XYZ";
import type OLMap from "ol/Map";
import { Fill, Stroke, Style } from "ol/style";
import { useTooltip, type FeatureProps } from "./hooks/useTooltip";

import "react-openlayers/dist/index.css";
import styles from "./geojson-map.module.css";
import { useHoverHighlight } from "./hooks/useHoverHighlight";

const apiKey = import.meta.env.VITE_MAP_KEY;
const tileUrl = (dark: boolean) =>
  `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${apiKey}`;

const ATTRIBUTION = '© <a href="https://carto.com/attributions">CARTO</a>';

type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;

interface GeoJsonMapProps {
  data: GeoJsonData;
  center?: [number, number];
  zoom?: number;
  height?: number;
  className?: string;
  /** Called with the properties of every feature under the cursor. */
  renderTooltip?: (features: FeatureProps[]) => React.ReactNode;
  highlightOnHover?: boolean;
}

export function GeoJsonMap({
  data,
  center = [-79.0558, 35.9132],
  zoom = 11,
  height = 600,
  className,
  renderTooltip,
  highlightOnHover = true,
}: GeoJsonMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [map, setMap] = useState<OLMap | null | undefined>(null);
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
  const hoverStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({
          color: isDark ? "rgba(99, 179, 237, 0.45)" : "rgba(0, 90, 200, 0.35)",
        }),
        stroke: new Stroke({
          color: isDark ? "#90cdf4" : "#003d8f",
          width: 3,
        }),
        zIndex: 1,
      }),
    [isDark],
  );

  useHoverHighlight(map, highlightOnHover, hoverStyle);

  const [basemap] = useState(
    () =>
      new XYZ({ url: tileUrl(isDark), attributions: ATTRIBUTION, maxZoom: 20 }),
  );

  useEffect(() => {
    basemap.setUrl(tileUrl(isDark));
  }, [isDark, basemap]);

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hovered = useTooltip(map, tooltipRef, !!renderTooltip);

  return (
    <div
      className={`${styles.mapContainer} ${className || ""}`.trim()}
      style={{ width: "100%", height }}
    >
      <Map ref={setMap}>
        <TileLayer source={basemap} />
        <VectorLayer source={vectorSource} />
        <View center={fromLonLat(center)} zoom={zoom} />
        {renderTooltip && (
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{ visibility: hovered.length ? "visible" : "hidden" }}
          >
            {hovered.length > 0 && renderTooltip?.(hovered)}
          </div>
        )}
      </Map>
    </div>
  );
}
