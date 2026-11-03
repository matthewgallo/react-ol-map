import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import Feature, { type FeatureLike } from "ol/Feature";
import { Map, View, TileLayer } from "react-openlayers";
import { fromLonLat } from "ol/proj";
import { useTranslation } from "react-i18next";
import type OLMap from "ol/Map";
import type { StyleFunction } from "ol/style/Style";
import { FeatureDialog } from "./feature-dialog";
import { useTooltip, toProps, type FeatureProps } from "./hooks/useTooltip";
import { useHoverHighlight } from "./hooks/useHoverHighlight";
import { useSelectedHighlight } from "./hooks/useSelectedHighlight";
import { useIsTouchScreen } from "../../hooks/useIsTouchScreen";
import { useBasemap } from "./hooks/useBasemap";
import { useFeatureClick } from "./hooks/useFeatureClick";
import { useFullScreenControl } from "./hooks/useFullScreenControl";
import { useHoverCursor } from "./hooks/useHoverCursor";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useMapStyles } from "./hooks/useMapStyles";
import {
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";

import "react-openlayers/dist/index.css";
import styles from "./map.module.css";

// Markers draw above the tile highlight layer (zIndex 10)
const MARKERS_Z_INDEX = 20;

type GeoJsonData = FeatureCollection<Geometry, GeoJsonProperties>;
type Render = (features: FeatureProps[]) => ReactNode;

// Point features drawn as pins on top of the map's main dataset
export interface MarkerLayer {
  data: GeoJsonData;
  title?: string; // dialog title when a pin is selected
  render?: Render; // tooltip and dialog content
  visible?: boolean;
}

export interface BaseProps {
  center?: [number, number];
  zoom?: number;
  height?: number;
  className?: string;
  renderTooltip?: Render;
  renderDialog?: Render;
  dialogTitle?: string;
  highlightOnHover?: boolean;
  markers?: MarkerLayer;
  mainVisible?: boolean; // visibility of the `data` or `tiles` layer
  fullScreen?: boolean; // show the full screen button
}

type FeatureMapProps = BaseProps &
  ({ data: GeoJsonData; tiles?: never } | { tiles: TileConfig; data?: never });

export type { FeatureProps } from "./hooks/useTooltip";

export function FeatureMap({
  data,
  tiles,
  center = [-79.0558, 35.9132],
  zoom = 11,
  height,
  className,
  renderTooltip,
  renderDialog = renderTooltip,
  dialogTitle,
  highlightOnHover = true,
  markers,
  mainVisible = true,
  fullScreen = true,
}: FeatureMapProps) {
  const { t } = useTranslation();
  const isTouch = useIsTouchScreen();
  const [map, setMap] = useState<OLMap | null | undefined>(null);
  const basemap = useBasemap();
  const style = useMapStyles();

  // Layers
  useGeoJsonLayer(map, data, style.base, undefined, mainVisible);
  const markerLayer = useGeoJsonLayer(
    map,
    markers?.data,
    style.pin,
    MARKERS_Z_INDEX,
    markers?.visible ?? true,
  );
  useFullScreenControl(map, fullScreen, t("map.fullScreen"));

  const isMarker = useCallback(
    (f: FeatureLike | undefined) =>
      f instanceof Feature && !!markerLayer?.getSource()?.hasFeature(f),
    [markerLayer],
  );

  // Pins and shapes each have their own title, tooltip and dialog content
  const contentFor = useCallback(
    (f: FeatureLike | undefined) =>
      isMarker(f)
        ? {
            title: markers?.title ?? dialogTitle,
            tooltip: markers?.render,
            dialog: markers?.render,
          }
        : { title: dialogTitle, tooltip: renderTooltip, dialog: renderDialog },
    [isMarker, markers, dialogTitle, renderTooltip, renderDialog],
  );

  const highlightStyle = useCallback<StyleFunction>(
    (f) => (isMarker(f) ? style.pinHover : style.hover),
    [isMarker, style],
  );

  // Dialog + selection state. Features are kept after closing so the dialog
  // content doesn't vanish mid-way through the close animation.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<FeatureLike[]>([]);
  const selectedProps = useMemo(() => selected.map(toProps), [selected]);
  const highlighted = dialogOpen ? selected[0] : undefined;
  const dialog = contentFor(selected[0]);
  const hasDialog = !!renderDialog || !!markers?.render;

  const handleSelect = useCallback(
    (features: FeatureLike[]) => {
      if (!contentFor(features[0]).dialog) return;
      setSelected(features);
      setDialogOpen(true);
    },
    [contentFor],
  );

  // Interactions. Hover behaviors only apply to hover-capable pointers.
  const hoverEnabled = highlightOnHover && !isTouch;
  useFeatureClick(map, isTouch && hasDialog, handleSelect);
  useHoverCursor(map, hoverEnabled);
  useHoverHighlight(map, (!!data || !!markers) && hoverEnabled, highlightStyle);
  useSelectedHighlight(highlighted, highlightStyle); // GeoJSON features and markers
  useVectorTileLayer(
    map,
    tiles,
    style.base,
    style.hover,
    hoverEnabled,
    highlighted instanceof Feature ? undefined : highlighted?.getId(),
    mainVisible,
  ); // tile mode

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipEnabled = (!!renderTooltip || !!markers?.render) && !isTouch;
  const hovered = useTooltip(map, tooltipRef, tooltipEnabled);
  const renderHovered = hovered.length ? contentFor(hovered[0]).tooltip : null;
  const tooltip = renderHovered?.(hovered.map(toProps));

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
          {tooltipEnabled && (
            <div
              ref={tooltipRef}
              className={styles.tooltip}
              style={{ visibility: tooltip ? "visible" : "hidden" }}
            >
              {tooltip}
            </div>
          )}
        </Map>
      </div>

      {hasDialog && (
        <FeatureDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialog.title}
        >
          {dialog.dialog?.(selectedProps)}
        </FeatureDialog>
      )}
    </>
  );
}
