import { useEffect } from "react";
import type OLMap from "ol/Map";
import type { MapBrowserEvent } from "ol";

// Shows a pointer over any feature. Kept separate from the highlight hooks so
// overlaid layers don't fight over the cursor.
export const useHoverCursor = (
  map: OLMap | null | undefined,
  enabled: boolean,
) => {
  useEffect(() => {
    if (!map || !enabled) return;
    const targetEl = map.getTargetElement();
    if (!targetEl) return;

    const onPointerMove = (evt: MapBrowserEvent) => {
      const overControl = (
        evt.originalEvent.target as HTMLElement | null
      )?.closest(".ol-control");
      const overFeature =
        !evt.dragging && !overControl && map.hasFeatureAtPixel(evt.pixel);
      targetEl.style.cursor = overFeature ? "pointer" : "";
    };

    map.on("pointermove", onPointerMove);
    return () => {
      map.un("pointermove", onPointerMove);
      targetEl.style.cursor = "";
    };
  }, [map, enabled]);
};
