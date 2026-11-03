import { useEffect } from "react";
import type OLMap from "ol/Map";

// Calls `onClose` when Escape is pressed while the map element (focusable, and
// where OpenLayers handles its own keyboard shortcuts) or a control in it has
// focus
export const useCloseOnEscape = (
  map: OLMap | null | undefined,
  enabled: boolean,
  onClose: () => void,
) => {
  useEffect(() => {
    const targetEl = map?.getTargetElement();
    if (!targetEl || !enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    targetEl.addEventListener("keydown", onKeyDown);
    return () => targetEl.removeEventListener("keydown", onKeyDown);
  }, [map, enabled, onClose]);
};
