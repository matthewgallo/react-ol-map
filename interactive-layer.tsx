import { useEffect, useId, useMemo, type ReactNode } from "react";
import Feature, { type FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";
import type { Extent } from "ol/extent";
import { useTranslation } from "react-i18next";
import { useFeatureMap } from "./context";
import { FeatureDialog } from "./feature-dialog";
import { FeaturePanel } from "./feature-panel";
import { useHighlightLayer } from "./hooks/useHighlightLayer";
import { useMapLayer } from "./hooks/useMapLayer";
import { clusterMembers, isCluster } from "./utils/cluster";
import { featuresAtPoint } from "./utils/featuresAtPoint";
import { layerColorStyle } from "./utils/layerColor";
import {
  toProps,
  type LayerProps,
  type MapColor,
  type VectorBaseLayer,
} from "./types";

import styles from "./map.module.css";

// Highlights draw this far above their layer: over the other area layers,
// but under the markers (zIndex 20)
const HIGHLIGHT_Z_OFFSET = 10;

const featureExtent = (f: FeatureLike): Extent | undefined =>
  f instanceof Feature ? f.getGeometry()?.getExtent() : f.getExtent();

export interface InteractiveLayerProps extends LayerProps {
  layer: VectorBaseLayer | undefined; // undefined while its data loads
  hoverStyle: StyleLike; // for hovered and selected features, drawn in order
  // Extent to zoom to when a feature is selected; defaults to its geometry's
  extentOf?: (feature: FeatureLike) => Extent | undefined;
}

// The building block of every layer: adds an OpenLayers vector layer to the
// enclosing FeatureMap and wires it into the map's shared hover and selection.
// The layer owns its highlight, tooltip and details content, so any number of
// layers can be stacked, each with its own. Use it directly for a layer type
// AreaLayer and MarkerLayer don't cover.
export function InteractiveLayer({
  id: idProp,
  layer,
  hoverStyle,
  extentOf = featureExtent,
  title,
  featureTitle,
  renderTooltip,
  renderDialog = renderTooltip,
  visible = true,
  interactive = true,
  zIndex = 0,
  highlightZIndex = zIndex + HIGHLIGHT_Z_OFFSET,
  color = "accent",
}: InteractiveLayerProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const {
    map,
    register,
    hovered,
    selected,
    detailsOpen,
    closeDetails,
    highlightOnHover,
  } = useFeatureMap();
  const hasDetails = !!renderDialog;

  useMapLayer(map, layer, zIndex, visible);

  useEffect(() => {
    if (!layer || !interactive) return;
    return register(id, { layer, hasDetails, extentOf });
  }, [register, id, layer, interactive, hasDetails, extentOf]);

  // The map's hover and selection, if they're on this layer
  const ownHovered = hovered?.layerId === id ? hovered.feature : undefined;
  const ownSelected = selected?.layerId === id ? selected.feature : undefined;
  const open = !!ownSelected && detailsOpen;

  useHighlightLayer(
    map,
    layer,
    hoverStyle,
    highlightZIndex,
    visible,
    highlightOnHover ? ownHovered : undefined,
    open ? ownSelected : undefined,
  );

  // Close the details when this layer is hidden
  useEffect(() => {
    if (open && !visible) closeDetails();
  }, [open, visible, closeDetails]);

  // Points drawn on the same spot, such as schools sharing a campus, can't
  // be told apart on the map, so the tooltip and details show all of them
  const resolution = map?.getView().getResolution();
  const hoveredProps = useMemo(
    () => ownHovered && propsAt(layer, ownHovered, resolution),
    [layer, ownHovered, resolution],
  );
  const selectedProps = useMemo(
    () => ownSelected && propsAt(layer, ownSelected, resolution),
    [layer, ownSelected, resolution],
  );
  // A cluster can hold hundreds of points, so its tooltip only counts them
  const tooltip =
    ownHovered && isCluster(ownHovered) && renderTooltip
      ? t("map.clusterCount", { count: hoveredProps?.length })
      : hoveredProps && renderTooltip?.(hoveredProps);
  const details = selectedProps && renderDialog?.(selectedProps);
  const detailsTitle = (selectedProps && featureTitle?.(selectedProps)) || title;

  return (
    <>
      {tooltip && (
        <div
          className={styles.tooltip}
          // Matches the layer's outlines, to tell layers apart where they overlap
          style={layerColorStyle(color)}
        >
          {title && (
            <div className={styles.tooltipTitle}>
              <span className={styles.swatch} aria-hidden />
              {title}
            </div>
          )}
          {tooltip}
        </div>
      )}
      {ownSelected && hasDetails && (
        <FeatureDetails open={open} title={detailsTitle} color={color}>
          {details}
        </FeatureDetails>
      )}
    </>
  );
}

const propsAt = (
  layer: VectorBaseLayer | undefined,
  feature: FeatureLike,
  resolution: number | undefined,
) =>
  (
    clusterMembers(feature) ??
    (layer && resolution !== undefined
      ? featuresAtPoint(layer, feature, resolution)
      : [feature])
  ).map(toProps);

// A side panel for hover-capable pointers, or a bottom sheet on touch screens
function FeatureDetails({
  open,
  title,
  color,
  children,
}: {
  open: boolean;
  title?: string;
  color: MapColor;
  children: ReactNode;
}) {
  const { map, isTouch, panelRef, closeDetails } = useFeatureMap();

  if (isTouch) {
    return (
      <FeatureDialog
        open={open}
        onOpenChange={(next) => !next && closeDetails()}
        title={title}
        color={color}
        // The map's own clicks select another feature or close it
        ignoreTapsIn={map?.getTargetElement()}
        // Only while open: another layer's sheet may be closing as it opens
        sheetRef={open ? panelRef : undefined}
      >
        {children}
      </FeatureDialog>
    );
  }

  return (
    open && (
      <FeaturePanel
        ref={panelRef}
        title={title}
        color={color}
        onClose={closeDetails}
      >
        {children}
      </FeaturePanel>
    )
  );
}
