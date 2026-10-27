import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import type { FeatureLike } from "ol/Feature";
import { Map, View, TileLayer, VectorLayer } from "react-openlayers";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import { useTheme } from "next-themes";
import XYZ from "ol/source/XYZ";
import type OLMap from "ol/Map";
import { Fill, Stroke, Style } from "ol/style";
import { useTooltip, toProps, type FeatureProps } from "./hooks/useTooltip";
import { useHoverHighlight } from "./hooks/useHoverHighlight";
import { useSelectedHighlight } from "./hooks/useSelectedHighlight";
import { useIsTouchScreen } from "../../hooks/useIsTouchScreen";
import { useFeatureClick } from "./hooks/useFeatureClick";
import {
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";

import "react-openlayers/dist/index.css";
import styles from "./geojson-map.module.css";

const apiKey = import.meta.env.VITE_MAP_KEY;
const tileUrl = (dark: boolean) =>
  `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${apiKey}`;

const ATTRIBUTION = '© <a href="https://carto.com/attributions">CARTO</a>';

type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;

interface BaseProps {
  center?: [number, number];
  zoom?: number;
  height?: number;
  className?: string;
  renderTooltip?: (features: FeatureProps[]) => ReactNode;
  renderDialog?: (features: FeatureProps[]) => ReactNode;
  dialogTitle?: string;
  highlightOnHover?: boolean;
}

type GeoJsonMapProps = BaseProps &
  ({ data: GeoJsonData; tiles?: never } | { tiles: TileConfig; data?: never });

export function GeoJsonMap({
  data,
  tiles,
  center = [-79.0558, 35.9132],
  zoom = 11,
  height = 600,
  className,
  renderTooltip,
  renderDialog: renderDialogProp,
  dialogTitle = "Details",
  highlightOnHover = true,
}: GeoJsonMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isTouch = useIsTouchScreen();
  const [map, setMap] = useState<OLMap | null | undefined>(null);

  const vectorSource = useMemo(
    () =>
      data
        ? new VectorSource({
            features: new GeoJSON().readFeatures(data, {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:3857",
            }),
          })
        : undefined,
    [data],
  );

  const hoverStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({
          color: isDark ? "rgba(99, 179, 237, 0.45)" : "rgba(0, 90, 200, 0.35)",
        }),
        stroke: new Stroke({ color: isDark ? "#90cdf4" : "#003d8f", width: 3 }),
        zIndex: 1,
      }),
    [isDark],
  );

  const baseStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: "rgba(255, 255, 255, 0.4)" }),
        stroke: new Stroke({ color: "#3399CC", width: 1.25 }),
      }),
    [],
  );

  // Dialog + selection state. Features are kept after closing so the dialog
  // content doesn't vanish mid-way through the close animation.
  const renderDialog = renderDialogProp ?? renderTooltip;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<FeatureLike[]>([]);
  const selectedProps = useMemo(() => selected.map(toProps), [selected]);
  const highlighted = dialogOpen ? selected[0] : undefined;

  const handleSelect = useCallback((features: FeatureLike[]) => {
    setSelected(features);
    setDialogOpen(true);
  }, []);

  useFeatureClick(map, isTouch && !!renderDialog, handleSelect);

  // Hover behaviors only apply to hover-capable pointers
  const hoverEnabled = highlightOnHover && !isTouch;
  useHoverHighlight(map, !!data && hoverEnabled, hoverStyle);
  useSelectedHighlight(highlighted, hoverStyle); // GeoJSON mode
  useVectorTileLayer(
    map,
    tiles,
    baseStyle,
    hoverStyle,
    hoverEnabled,
    highlighted?.getId(),
  ); // tile mode

  const [basemap] = useState(
    () =>
      new XYZ({ url: tileUrl(isDark), attributions: ATTRIBUTION, maxZoom: 20 }),
  );
  useEffect(() => {
    basemap.setUrl(tileUrl(isDark));
  }, [isDark, basemap]);

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hovered = useTooltip(map, tooltipRef, !!renderTooltip && !isTouch);

  return (
    <>
      <div
        className={`${styles.mapContainer} ${className || ""}`.trim()}
        style={{ width: "100%", height }}
      >
        <Map ref={setMap}>
          <TileLayer source={basemap} />
          {vectorSource && <VectorLayer source={vectorSource} />}
          <View center={fromLonLat(center)} zoom={zoom} />
          {renderTooltip && !isTouch && (
            <div
              ref={tooltipRef}
              className={styles.tooltip}
              style={{ visibility: hovered.length ? "visible" : "hidden" }}
            >
              {hovered.length > 0 && renderTooltip(hovered)}
            </div>
          )}
        </Map>
      </div>

      {renderDialog && (
        <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
          <Dialog.Content
            className={styles.dialogContent}
            maxWidth="450px"
            aria-describedby={undefined}
          >
            <Dialog.Title>{dialogTitle}</Dialog.Title>
            {renderDialog(selectedProps)}
            <Flex justify="end" mt="4">
              <Dialog.Close>
                <Button variant="soft">Close</Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  );
}
