import { useFeatureMap } from "./context";
import {
  InteractiveLayer,
  type InteractiveLayerProps,
} from "./interactive-layer";
import { usePinStyles } from "./hooks/useLayerStyles";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useLayerData } from "./hooks/useLayerData";
import {
  useTileExtent,
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";
import type { PinComponent } from "./pin";
import type { GeoJsonData, LayerProps } from "./types";

// Markers draw above area layers and their highlights by default
const MARKERS_Z_INDEX = 20;

// One way to load the points, as for AreaLayer:
// - data: inline GeoJSON, loaded all at once
// - url: GeoJSON fetched from a URL, loaded all at once
// - tiles: vector tiles, streamed for what's in view (large datasets)
type MarkerSource =
  | { data: GeoJsonData; url?: never; tiles?: never }
  | { url: string; data?: never; tiles?: never }
  | { tiles: TileConfig; data?: never; url?: never };

export type MarkerLayerProps = LayerProps &
  MarkerSource & {
    pin?: PinComponent; // defaults to DefaultPin; define it outside render
    pinAnchor?: [number, number]; // point of the pin on the feature; defaults to its tip, or bottom center for a custom pin
  };

type Styles = ReturnType<typeof usePinStyles>;
type SourceLayerProps = Omit<InteractiveLayerProps, "layer" | "hoverStyle"> & {
  styles: Styles;
};

// Point features drawn as pins, which take priority over the shapes beneath
export function MarkerLayer({
  data,
  url,
  tiles,
  pin,
  pinAnchor,
  color,
  zIndex = MARKERS_Z_INDEX,
  ...props
}: MarkerLayerProps) {
  const styles = usePinStyles(pin, pinAnchor, color);
  return tiles ? (
    <TileMarkers
      url={tiles.url}
      styles={styles}
      color={color}
      zIndex={zIndex}
      {...props}
    />
  ) : (
    <GeoJsonMarkers
      data={data}
      url={url}
      styles={styles}
      color={color}
      zIndex={zIndex}
      {...props}
    />
  );
}

function GeoJsonMarkers({
  data,
  url,
  styles,
  ...props
}: SourceLayerProps & { data?: GeoJsonData; url?: string }) {
  const layer = useGeoJsonLayer(useLayerData(data, url), styles.base);
  return <InteractiveLayer layer={layer} hoverStyle={styles.hover} {...props} />;
}

function TileMarkers({
  url,
  styles,
  ...props
}: SourceLayerProps & { url: string }) {
  const { map } = useFeatureMap();
  const layer = useVectorTileLayer(url, styles.base);
  const extentOf = useTileExtent(map, layer);
  return (
    <InteractiveLayer
      layer={layer}
      hoverStyle={styles.hover}
      extentOf={extentOf}
      {...props}
    />
  );
}
