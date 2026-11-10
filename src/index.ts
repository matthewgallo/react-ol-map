export { FeatureMap, type FeatureMapProps } from "./feature-map";
export { AreaLayer, type AreaLayerProps } from "./area-layer";
export { MarkerLayer, type MarkerLayerProps } from "./marker-layer";
export {
  LegendScale,
  MapLegend,
  ShadeLegend,
  type LegendItem,
  type RangeStyle,
} from "./map-legend";
export {
  InteractiveLayer,
  type InteractiveLayerProps,
} from "./interactive-layer";
export { useFeatureMap } from "./context";
export { useLastSelected } from "./hooks/useLastSelected";
export { useLayerFeatures } from "./hooks/useLayerFeatures";
export type { TileConfig } from "./hooks/useVectorTileLayer";
export {
  formatBoundsRange,
  formatCountRange,
  type Shade,
  type ShadeClass,
} from "./utils/shade";
export type {
  ClusterOption,
  FeatureFilter,
  FeatureProps,
  GeoJsonData,
  Hit,
  LayerProps,
  MapColor,
  Render,
} from "./types";
export { DefaultPin, type PinComponent, type PinProps } from "./pin";
// The hovered and selected outline, for custom pins that draw their own
export {
  HALO_DARK,
  HALO_EDGE,
  HALO_LIGHT,
  HALO_WIDTH,
} from "./utils/halo";
export { DEFAULT_LABELS, type MapLabels } from "./labels";
export {
  cartoBasemap,
  type Appearance,
  type Basemap,
} from "./hooks/useBasemap";
export type { Register } from "./types";
// For rendering layer content outside a FeatureMap, such as in tests
export {
  FeatureMapContext,
  type FeatureMapContextValue,
  type LayerRegistration,
  type LayerStatus,
} from "./context";
