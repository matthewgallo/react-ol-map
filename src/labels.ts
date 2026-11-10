import { createContext, useContext } from "react";

// Text the map shows, for translating it. Pass any of them to FeatureMap's
// `labels`; the rest stay in English.
export interface MapLabels {
  details: string; // details heading for a layer without a title
  close: string;
  fullScreen: string;
  resetView: string;
  loadError: string;
  legend: string;
  noData: string; // legend item for features without a value
  clusterCount: (count: number) => string; // tooltip heading for a cluster
}

export const DEFAULT_LABELS: MapLabels = {
  details: "Details",
  close: "Close",
  fullScreen: "Toggle full screen",
  resetView: "Reset view",
  loadError: "Couldn't load map data.",
  legend: "Legend",
  noData: "No data",
  clusterCount: (count) => `${count} locations`,
};

interface LabelsContextValue {
  labels: MapLabels;
  locale: string | undefined; // for formatting numbers; the browser's if unset
}

export const LabelsContext = createContext<LabelsContextValue>({
  labels: DEFAULT_LABELS,
  locale: undefined,
});

export const useLabels = () => useContext(LabelsContext);
