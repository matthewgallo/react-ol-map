import { useEffect, useId, type ReactNode } from "react";
import Feature, { type FeatureLike } from "ol/Feature";
import type { Style } from "ol/style";
import type { Extent } from "ol/extent";
import { useFeatureMap } from "./context";
import { FeatureDialog } from "./feature-dialog";
import { FeaturePanel } from "./feature-panel";
import { useHighlightLayer } from "./hooks/useHighlightLayer";
import { useMapLayer } from "./hooks/useMapLayer";
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
  hoverStyle: Style[]; // for hovered and selected features, drawn in order
  // Extent to zoom to when a feature is selected; defaults to its geometry's
  extentOf?: (feature: FeatureLike) => Extent | undefined;
}

// The building block of every layer: adds an OpenLayers vector layer to the
// enclosing FeatureMap and wires it into the map's shared hover and selection.
// The layer owns its highlight, tooltip and details content, so any number of
// layers can be stacked, each with its own. Use it directly for a layer type
// AreaLayer and MarkerLayer don't cover.
export function InteractiveLayer({
  layer,
  hoverStyle,
  extentOf = featureExtent,
  title,
  renderTooltip,
  renderDialog = renderTooltip,
  visible = true,
  interactive = true,
  zIndex = 0,
  color = "accent",
}: InteractiveLayerProps) {
  const id = useId();
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
    zIndex + HIGHLIGHT_Z_OFFSET,
    visible,
    highlightOnHover ? ownHovered : undefined,
    open ? ownSelected : undefined,
  );

  // Close the details when this layer is hidden
  useEffect(() => {
    if (open && !visible) closeDetails();
  }, [open, visible, closeDetails]);

  const tooltip = ownHovered && renderTooltip?.([toProps(ownHovered)]);
  const details = ownSelected && renderDialog?.([toProps(ownSelected)]);

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
        <FeatureDetails open={open} title={title} color={color}>
          {details}
        </FeatureDetails>
      )}
    </>
  );
}

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
  const { isTouch, panelRef, closeDetails } = useFeatureMap();

  if (isTouch) {
    return (
      <FeatureDialog
        open={open}
        onOpenChange={(next) => !next && closeDetails()}
        title={title}
        color={color}
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
