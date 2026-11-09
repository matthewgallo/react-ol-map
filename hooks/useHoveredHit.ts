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
// element for tooltips to follow. Tooltips are anchored to it and flip away
// from the map's edges where anchor positioning is supported. Otherwise they
// use data-pointer-x ("left" or "right") and data-pointer-y ("top" or
// "bottom"), naming the half of the map the pointer is in, to open toward the
// side with more room.
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

    const hoverAt = (pixel: Pixel, coordinate: Coordinate) => {
      const next = hitAt(pixel, coordinate);
      if (next) {
        targetEl.style.setProperty("--pointer-x", `${pixel[0]}px`);
        targetEl.style.setProperty("--pointer-y", `${pixel[1]}px`);
        const [width, height] = map.getSize() ?? [0, 0];
        targetEl.dataset.pointerX = pixel[0] > width / 2 ? "right" : "left";
        targetEl.dataset.pointerY = pixel[1] > height / 2 ? "bottom" : "top";
      }
      update(next);
    };

    // Where the pointer rests on the map, if it does
    let pointer: Pixel | undefined;
    const onMove = (evt: MapBrowserEvent) => {
      pointer = isOverControl(evt) ? undefined : evt.pixel;
      if (evt.dragging || !pointer) return update(undefined);
      hoverAt(evt.pixel, evt.coordinate);
    };
    const onLeave = () => {
      pointer = undefined;
      update(undefined);
    };
    // What's under a resting pointer changes once the view does: zooming
    // replaces clusters, which would leave a tooltip for one that's gone
    const onMoveEnd = () => {
      if (pointer) hoverAt(pointer, map.getCoordinateFromPixel(pointer));
    };

    map.on("pointermove", onMove);
    map.on("click", onMove);
    map.on("moveend", onMoveEnd);
    viewportEl?.addEventListener("pointerleave", onLeave);
    return () => {
      map.un("pointermove", onMove);
      map.un("click", onMove);
      map.un("moveend", onMoveEnd);
      viewportEl?.removeEventListener("pointerleave", onLeave);
      update(undefined);
    };
  }, [map, enabled, hitAt]);

  return hovered;
};
