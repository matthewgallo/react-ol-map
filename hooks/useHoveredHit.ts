import { useEffect, useState } from "react";
import type OLMap from "ol/Map";
import type { MapBrowserEvent } from "ol";
import type { Pixel } from "ol/pixel";
import type { Coordinate } from "ol/coordinate";
import type { Hit } from "../types";
import { sameHit } from "../utils/pickHit";

const isOverControl = (evt: MapBrowserEvent) =>
  !!(evt.originalEvent.target as HTMLElement | null)?.closest(".ol-control");

// Tracks the top-most feature under the pointer, shared by every layer for
// hover highlights and tooltips. Also shows a pointer cursor over features,
// and exposes the pointer position as --pointer-x/--pointer-y on the map
// element for tooltips to follow.
export const useHoveredHit = (
  map: OLMap | null | undefined,
  enabled: boolean,
  hitAt: (pixel: Pixel, coordinate: Coordinate) => Hit | undefined,
) => {
  const [hovered, setHovered] = useState<Hit>();

  useEffect(() => {
    const targetEl = map?.getTargetElement();
    if (!map || !targetEl || !enabled) return;
    // OpenLayers only sends pointermove from its viewport, so leaving it for
    // UI overlaid on the map (the details panel) must clear the hover, or the
    // pointer cursor and tooltip stay up over that UI
    const viewportEl = map.getViewport();

    const update = (next: Hit | undefined) => {
      targetEl.style.cursor = next ? "pointer" : "";
      setHovered((prev) => (sameHit(prev, next) ? prev : next));
    };

    const onMove = (evt: MapBrowserEvent) => {
      if (evt.dragging || isOverControl(evt)) return update(undefined);
      const next = hitAt(evt.pixel, evt.coordinate);
      if (next) {
        targetEl.style.setProperty("--pointer-x", `${evt.pixel[0]}px`);
        targetEl.style.setProperty("--pointer-y", `${evt.pixel[1]}px`);
      }
      update(next);
    };
    const onLeave = () => update(undefined);

    map.on("pointermove", onMove);
    map.on("click", onMove);
    viewportEl?.addEventListener("pointerleave", onLeave);
    return () => {
      map.un("pointermove", onMove);
      map.un("click", onMove);
      viewportEl?.removeEventListener("pointerleave", onLeave);
      update(undefined);
    };
  }, [map, enabled, hitAt]);

  return hovered;
};
