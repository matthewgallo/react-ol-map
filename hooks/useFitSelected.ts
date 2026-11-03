import { useEffect, useRef } from "react";
import type OLMap from "ol/Map";
import type { FeatureLike } from "ol/Feature";
import type { Extent } from "ol/extent";
import { getHeight, getWidth } from "ol/extent";

const DURATION = 400;
const MAX_ZOOM = 17; // don't zoom in further than this on small areas

// Animates the view to fit the selected feature, leaving `padding` (top,
// right, bottom, left in pixels) clear for UI over the map. Points are only
// centered, keeping the current zoom.
export const useFitSelected = (
  map: OLMap | null | undefined,
  selected: FeatureLike | undefined,
  extentOf: (feature: FeatureLike) => Extent | undefined,
  getPadding: () => number[],
) => {
  // Only a new selection refits, not a change to these callbacks
  const extentOfRef = useRef(extentOf);
  const getPaddingRef = useRef(getPadding);
  useEffect(() => {
    extentOfRef.current = extentOf;
    getPaddingRef.current = getPadding;
  });

  useEffect(() => {
    if (!map || !selected) return;
    const extent = extentOfRef.current(selected);
    if (!extent) return;

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
  }, [map, selected]);
};
