import { useEffect, useRef } from "react";
import type OLMap from "ol/Map";
import type { Extent } from "ol/extent";
import { getHeight, getWidth, scaleFromCenter } from "ol/extent";

const DURATION = 400;
const MAX_ZOOM = 16; // don't zoom in further than this on small areas
// Fits an area this many times its size, so it sits in some surrounding
// context rather than filling the view (2 is about one zoom level out)
const CONTEXT_SCALE = 2;

// Animates the view to fit the selected feature, leaving `padding` (top,
// right, bottom, left in pixels) clear for UI over the map. Points are only
// centered, keeping the current zoom. Waits until `ready`, for UI whose size
// sets the padding to mount.
export const useFitSelected = <T>(
  map: OLMap | null | undefined,
  selected: T | undefined,
  extentOf: (selected: T) => Extent | undefined,
  getPadding: () => number[],
  ready = true,
) => {
  // Only a new selection refits, not a change to these callbacks
  const extentOfRef = useRef(extentOf);
  const getPaddingRef = useRef(getPadding);
  useEffect(() => {
    extentOfRef.current = extentOf;
    getPaddingRef.current = getPadding;
  });

  useEffect(() => {
    if (!map || !selected || !ready) return;
    const featureExtent = extentOfRef.current(selected);
    if (!featureExtent) return;
    const extent = [...featureExtent];
    scaleFromCenter(extent, CONTEXT_SCALE);

    const view = map.getView();
    const isPoint = getWidth(extent) === 0 && getHeight(extent) === 0;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    view.fit(extent, {
      padding: getPaddingRef.current(),
      maxZoom: isPoint ? view.getZoom() : MAX_ZOOM,
      duration: reduceMotion ? 0 : DURATION,
    });
  }, [map, selected, ready]);
};
