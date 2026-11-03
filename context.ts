import { createContext, useContext, type RefObject } from "react";
import type OLMap from "ol/Map";
import type { FeatureLike } from "ol/Feature";
import type { Extent } from "ol/extent";
import type { Hit, VectorBaseLayer } from "./types";

// What an interactive layer tells the map about itself
export interface LayerRegistration {
  layer: VectorBaseLayer; // hit-tested for hover and clicks
  hasDetails: boolean; // whether clicking a feature opens details
  extentOf: (feature: FeatureLike) => Extent | undefined; // for zoom to fit
}

export type LayerStatus = "loading" | "error";

export interface FeatureMapContextValue {
  map: OLMap | null | undefined;
  isTouch: boolean;
  highlightOnHover: boolean;
  hovered: Hit | undefined; // top-most feature under the pointer
  selected: Hit | undefined; // kept after closing, for the close animation
  detailsOpen: boolean;
  closeDetails: () => void;
  panelRef: RefObject<HTMLElement | null>; // the open side panel, if any
  // Returns a function that unregisters the layer
  register: (id: string, layer: LayerRegistration) => () => void;
  setStatus: (id: string, status: LayerStatus | undefined) => void;
}

export const FeatureMapContext = createContext<FeatureMapContextValue | null>(
  null,
);

// For layer components, which must be rendered inside a FeatureMap
export const useFeatureMap = () => {
  const ctx = useContext(FeatureMapContext);
  if (!ctx) throw new Error("Map layers must be rendered inside <FeatureMap>");
  return ctx;
};
