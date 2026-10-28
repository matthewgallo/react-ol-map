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
import { Map, View, TileLayer } from "react-openlayers";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { fromLonLat } from "ol/proj";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import XYZ from "ol/source/XYZ";
import type OLMap from "ol/Map";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { useTooltip, toProps, type FeatureProps } from "./hooks/useTooltip";
import { useHoverHighlight } from "./hooks/useHoverHighlight";
import { useSelectedHighlight } from "./hooks/useSelectedHighlight";
import { useIsTouchScreen } from "../../hooks/useIsTouchScreen";
import { useFeatureClick } from "./hooks/useFeatureClick";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useThemeColors } from "./hooks/useThemeColors";
import {
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";

import "react-openlayers/dist/index.css";
import styles from "./geojson-map.module.css";

const apiKey = import.meta.env.VITE_MAP_KEY;
const tileUrl = (dark: boolean) =>
  `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${apiKey}`;

const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;

export interface BaseProps {
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

export type { FeatureProps } from "./hooks/useTooltip";

export function GeoJsonMap({
  data,
  tiles,
  center = [-79.0558, 35.9132],
  zoom = 11,
  height,
  className,
  renderTooltip,
  renderDialog: renderDialogProp,
  dialogTitle,
  highlightOnHover = true,
}: GeoJsonMapProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isTouch = useIsTouchScreen();
  const [map, setMap] = useState<OLMap | null | undefined>(null);

  // Feature colors follow the Radix accent color and light/dark appearance
  const colors = useThemeColors();

  const hoverStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: colors.hoverFill }),
        stroke: new Stroke({ color: colors.hoverStroke, width: 3 }),
        image: new Circle({
          radius: 7,
          fill: new Fill({ color: colors.hoverStroke }),
          stroke: new Stroke({ color: colors.outline, width: 2 }),
        }),
        zIndex: 1,
      }),
    [colors],
  );

  const baseStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: colors.fill }),
        stroke: new Stroke({ color: colors.stroke, width: 1.25 }),
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: colors.stroke }),
          stroke: new Stroke({ color: colors.outline, width: 1.5 }),
        }),
      }),
    [colors],
  );

  useGeoJsonLayer(map, data, baseStyle);

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
      new XYZ({
        url: tileUrl(isDark),
        attributions: ATTRIBUTION,
        attributionsCollapsible: false,
        maxZoom: 20,
      }),
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
        style={height ? { height } : undefined}
      >
        {/* react-openlayers adds an OSM layer unless `layers` is given, which means extra layers would be rendered unintentionally */}
        <Map ref={setMap} layers={[]}>
          <TileLayer source={basemap} />
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
            <Dialog.Title>{dialogTitle ?? t("map.details")}</Dialog.Title>
            {renderDialog(selectedProps)}
            <Flex justify="end" mt="4">
              <Dialog.Close>
                <Button variant="soft">{t("map.close")}</Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  );
}
