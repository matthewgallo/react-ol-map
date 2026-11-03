import { useEffect, useRef } from "react";
import type OLMap from "ol/Map";
import type { MapBrowserEvent } from "ol";
import Feature, { type FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";
import { pickFeatures } from "../utils/pickFeatures";

export const useHoverHighlight = (
  map: OLMap | null | undefined,
  enabled: boolean,
  hoverStyle: StyleLike,
  selected?: FeatureLike, // keeps its highlight from useSelectedHighlight
) => {
  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    if (!map || !enabled) return;

    let hovered: Feature | undefined;
    const targetEl = map.getTargetElement();

    // undefined = fall back to the layer's style
    const unstyle = (f: Feature | undefined) => {
      if (f !== selectedRef.current) f?.setStyle(undefined);
    };
    const clear = () => {
      unstyle(hovered);
      hovered = undefined;
    };

    const onPointerMove = (evt: MapBrowserEvent) => {
      const overControl = (
        evt.originalEvent.target as HTMLElement | null
      )?.closest(".ol-control");
      if (evt.dragging || overControl) return clear();

      const [picked] = pickFeatures(
        map.getFeaturesAtPixel(evt.pixel),
        evt.coordinate,
        1,
      );
      const next = picked instanceof Feature ? picked : undefined;
      if (next === hovered) return; // same feature, nothing to do

      unstyle(hovered);
      if (next !== selectedRef.current) next?.setStyle(hoverStyle);
      hovered = next;
    };

    map.on("pointermove", onPointerMove);
    targetEl?.addEventListener("pointerleave", clear);

    return () => {
      map.un("pointermove", onPointerMove);
      targetEl?.removeEventListener("pointerleave", clear);
      clear();
    };
  }, [map, enabled, hoverStyle]);
};
