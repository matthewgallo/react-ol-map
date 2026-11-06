import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Callout, Skeleton } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Map, View, TileLayer } from "react-openlayers";
import { fromLonLat } from "ol/proj";
import { useTranslation } from "react-i18next";
import type OLMap from "ol/Map";
import type BaseLayer from "ol/layer/Base";
import type { Pixel } from "ol/pixel";
import type { Coordinate } from "ol/coordinate";
import {
  FeatureMapContext,
  type FeatureMapContextValue,
  type LayerRegistration,
  type LayerStatus,
} from "./context";
import { useIsTouchScreen } from "../../hooks/useIsTouchScreen";
import { useBasemap } from "./hooks/useBasemap";
import { useCloseOnEscape } from "./hooks/useCloseOnEscape";
import { useFeatureClick } from "./hooks/useFeatureClick";
import { useFitSelected } from "./hooks/useFitSelected";
import { useFullScreenControl } from "./hooks/useFullScreenControl";
import { useHomeView, type Bounds } from "./hooks/useHomeView";
import { useHoveredHit } from "./hooks/useHoveredHit";
import { ResetViewButton } from "./reset-view-button";
import { featuresInView } from "./utils/featuresInView";
import { pickHit } from "./utils/pickHit";
import { scrollMapAboveSheet } from "./utils/scrollMapAboveSheet";
import type { Hit } from "./types";

import "react-openlayers/dist/index.css";
import styles from "./map.module.css";

const DEFAULT_CENTER: [number, number] = [-79.0558, 35.9132];

// Space kept clear around a selected feature when zooming to it
const FIT_PADDING = 48;
// Smallest height left to fit a selection into, however much is covered
const MIN_FIT_HEIGHT = 64;

// Clicks reach a little past a feature's edge, for small or thin features
const CLICK_TOLERANCE = 6;

export interface FeatureMapProps {
  center?: [number, number];
  zoom?: number;
  // Fitted to the map's size in place of `center` and `zoom`, so all of an
  // area is in view however big the map is
  bounds?: Bounds;
  height?: number;
  className?: string;
  highlightOnHover?: boolean;
  fullScreen?: boolean; // show the full screen button
  // show a reset button once moved away from `center` and `zoom`
  resetView?: boolean;
  children?: ReactNode; // layers: AreaLayer, MarkerLayer, InteractiveLayer
}

// A basemap that layers are stacked on as children. The map owns what's
// shared between layers: which feature is hovered (the top-most one across
// all layers) and which is selected (one at a time). Each layer draws its own
// highlight, tooltip and details for its features.
export function FeatureMap({
  center,
  zoom = 11,
  bounds,
  height,
  className,
  highlightOnHover = true,
  fullScreen = true,
  resetView = true,
  children,
}: FeatureMapProps) {
  const { t } = useTranslation();
  const isTouch = useIsTouchScreen();
  const [map, setMap] = useState<OLMap | null | undefined>(null);
  const basemap = useBasemap();
  useFullScreenControl(map, fullScreen, t("map.fullScreen"));
  // Until `bounds` are fitted, start in their middle
  const [lon, lat] =
    center ??
    (bounds
      ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]
      : DEFAULT_CENTER);
  const viewCenter = useMemo(() => fromLonLat([lon, lat]), [lon, lat]);
  const home = useHomeView(map, viewCenter, zoom, bounds);

  // Selection state, shown in a dialog on touch screens and a side panel
  // otherwise. The feature is kept after closing so the dialog content doesn't
  // vanish mid-way through the close animation.
  const [selection, setSelection] = useState<{ hit: Hit; open: boolean }>();
  const closeDetails = useCallback(
    () => setSelection((s) => s && { ...s, open: false }),
    [],
  );

  // Interactive layers, by id. Only read from event handlers and effects.
  const layers = useRef(new globalThis.Map<string, LayerRegistration>());
  const register = useCallback((id: string, layer: LayerRegistration) => {
    layers.current.set(id, layer);
    return () => {
      layers.current.delete(id);
      setSelection((s) => (s?.hit.layerId === id ? undefined : s));
    };
  }, []);

  // Loading and error states reported by layers fetching their data
  const [statuses, setStatuses] = useState<Record<string, LayerStatus>>({});
  const setStatus = useCallback(
    (id: string, status: LayerStatus | undefined) =>
      setStatuses((prev) => {
        const next = { ...prev };
        if (status) next[id] = status;
        else delete next[id];
        return next;
      }),
    [],
  );
  const statusList = Object.values(statuses);

  // The top-most feature of an interactive layer at a pixel
  const hitAt = useCallback(
    (pixel: Pixel, coordinate: Coordinate, hitTolerance = 0) => {
      if (!map) return undefined;
      const ids = new globalThis.Map<BaseLayer, string>();
      layers.current.forEach(({ layer }, id) => ids.set(layer, id));
      const hits: Hit[] = [];
      map.forEachFeatureAtPixel(
        pixel,
        (feature, layer) => {
          const layerId = ids.get(layer);
          if (layerId) hits.push({ layerId, feature });
        },
        { hitTolerance, layerFilter: (l) => ids.has(l) },
      );
      return pickHit(hits, coordinate);
    },
    [map],
  );
  const clickHitAt = useCallback(
    (pixel: Pixel, coordinate: Coordinate) =>
      hitAt(pixel, coordinate, CLICK_TOLERANCE),
    [hitAt],
  );

  // Opens a feature's details from outside the map, such as a link between
  // features in details content
  const select = useCallback((hit: Hit) => {
    if (layers.current.get(hit.layerId)?.hasDetails) {
      setSelection({ hit, open: true });
    }
  }, []);
  const featuresOf = useCallback(
    (layerId: string) => {
      const layer = layers.current.get(layerId)?.layer;
      const size = map?.getSize();
      const resolution = map?.getView().getResolution();
      if (!map || !layer || !size || resolution === undefined) return [];
      return featuresInView(
        layer,
        map.getView().calculateExtent(size),
        resolution,
      );
    },
    [map],
  );

  // Interactions. Hover only applies to hover-capable pointers.
  const hovered = useHoveredHit(map, !isTouch, hitAt);
  const handleClick = useCallback((hit: Hit | undefined) => {
    // Empty map, or a feature without details content
    if (!hit || !layers.current.get(hit.layerId)?.hasDetails) {
      return setSelection((s) => s && { ...s, open: false });
    }
    setSelection({ hit, open: true });
  }, []);
  useFeatureClick(map, clickHitAt, handleClick);

  // Zoom to the selection, keeping it clear of the side panel. On touch
  // screens, first scroll the map above the bottom sheet, then keep the
  // selection clear of what of the map the sheet and page header still cover.
  // The open panel or sheet. Kept as state too, since a reopened sheet can
  // mount a render after the selection: the zoom waits for it on touch screens.
  const panelElement = useRef<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const panelRef = useCallback((element: HTMLElement | null) => {
    panelElement.current = element;
    setPanel(element);
  }, []);
  const extentOf = useCallback(
    ({ layerId, feature }: Hit) =>
      layers.current.get(layerId)?.extentOf(feature),
    [],
  );
  const fitPadding = useCallback(() => {
    const panel = panelElement.current;
    const mapElement = map?.getTargetElement();
    if (!isTouch || !panel || !mapElement) {
      const panelWidth = panel?.offsetWidth ?? 0;
      return [FIT_PADDING, FIT_PADDING, FIT_PADDING, FIT_PADDING + panelWidth];
    }
    const { coveredTop, coveredBottom } = scrollMapAboveSheet(
      mapElement,
      panel.offsetHeight,
    );
    // Leave at least a strip of the map to fit into
    const spare = Math.max(
      0,
      mapElement.offsetHeight - 2 * FIT_PADDING - MIN_FIT_HEIGHT,
    );
    const top = Math.min(coveredTop, spare);
    const bottom = Math.min(coveredBottom, spare - top);
    return [FIT_PADDING + top, FIT_PADDING, FIT_PADDING + bottom, FIT_PADDING];
  }, [isTouch, map]);
  const openHit = selection?.open ? selection.hit : undefined;
  useFitSelected(map, openHit, extentOf, fitPadding, !isTouch || !!panel);

  // The panel handles Escape itself while focused. Touch screens use the
  // dialog, which closes on Escape already.
  useCloseOnEscape(map, !!openHit && !isTouch, closeDetails);

  const context: FeatureMapContextValue = {
    map,
    isTouch,
    highlightOnHover: highlightOnHover && !isTouch,
    hovered,
    selected: selection?.hit,
    detailsOpen: !!selection?.open,
    closeDetails,
    select,
    featuresOf,
    panelRef,
    register,
    setStatus,
  };

  return (
    <FeatureMapContext value={context}>
      <div
        className={`${styles.mapContainer} ${className || ""}`.trim()}
        style={height ? { blockSize: height } : undefined}
      >
        {/* react-openlayers adds an OSM layer unless `layers` is given, which means extra layers would be rendered unintentionally */}
        <Map ref={setMap} layers={[]}>
          <TileLayer source={basemap} />
          <View center={viewCenter} zoom={zoom} />
          {resetView && (
            <ResetViewButton map={map} center={home.center} zoom={home.zoom} />
          )}
          {/* What tooltips are anchored to. Before them, as anchor positioning requires. */}
          <div className={styles.pointerAnchor} aria-hidden />
          {/* Inside the map element, so tooltips and panels stay visible in full screen */}
          {children}
        </Map>

        {statusList.includes("error") ? (
          <Callout.Root color="red" className={styles.status}>
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>{t("map.loadError")}</Callout.Text>
          </Callout.Root>
        ) : (
          statusList.includes("loading") && (
            <Skeleton className={styles.loading} />
          )
        )}
      </div>
    </FeatureMapContext>
  );
}
