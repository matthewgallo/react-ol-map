import { useEffect, useState, type RefObject } from "react";
import type OLMap from "ol/Map";
import { type MapBrowserEvent } from "ol";
import type { FeatureLike } from "ol/Feature";
import type { Pixel } from "ol/pixel";
import type { Coordinate } from "ol/coordinate";
import { pickFeatures } from "../utils/pickFeatures";

export type FeatureProps = Record<string, unknown>;

export const toProps = (feature: FeatureLike): FeatureProps => {
  const props = { ...feature.getProperties() };
  delete props.geometry; // getProperties() includes the geometry itself
  return props;
};

const sameFeatures = (a: FeatureLike[], b: FeatureLike[]) =>
  a.length === b.length && a.every((f, i) => f === b[i]);

export const useTooltip = (
  map: OLMap | null | undefined,
  tooltipRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  limit = 1,
): FeatureLike[] => {
  const [features, setFeatures] = useState<FeatureLike[]>([]);

  useEffect(() => {
    if (!map || !enabled) return;

    const update = (
      pixel: Pixel,
      coordinate: Coordinate,
      target: EventTarget | null,
    ) => {
      const overControl = (target as HTMLElement | null)?.closest(
        ".ol-control",
      );
      const next = overControl
        ? []
        : pickFeatures(map.getFeaturesAtPixel(pixel), coordinate, limit);

      const el = tooltipRef.current;
      if (el && next.length) {
        el.style.left = `${pixel[0]}px`;
        el.style.top = `${pixel[1]}px`;
      }

      setFeatures((prev) => (sameFeatures(prev, next) ? prev : next));
    };

    const onPointerMove = (evt: MapBrowserEvent) => {
      if (evt.dragging) return setFeatures((prev) => (prev.length ? [] : prev));
      update(evt.pixel, evt.coordinate, evt.originalEvent.target);
    };
    const onClick = (evt: MapBrowserEvent) =>
      update(evt.pixel, evt.coordinate, evt.originalEvent.target);
    const onLeave = () => setFeatures((prev) => (prev.length ? [] : prev));

    const targetEl = map.getTargetElement();
    map.on("pointermove", onPointerMove);
    map.on("click", onClick);
    targetEl?.addEventListener("pointerleave", onLeave);

    return () => {
      map.un("pointermove", onPointerMove);
      map.un("click", onClick);
      targetEl?.removeEventListener("pointerleave", onLeave);
      setFeatures([]);
    };
  }, [map, enabled, tooltipRef, limit]);

  return features;
};
