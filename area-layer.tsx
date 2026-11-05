import { useFeatureMap } from "./context";
import {
  InteractiveLayer,
  type InteractiveLayerProps,
} from "./interactive-layer";
import { useAreaStyles } from "./hooks/useLayerStyles";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useLayerData } from "./hooks/useLayerData";
import {
  useTileExtent,
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";
import type { GeoJsonData, LayerProps } from "./types";

// One way to load the features, each suited to a different size:
// - data: inline GeoJSON, loaded all at once
// - url: GeoJSON fetched from a URL, loaded all at once
// - tiles: vector tiles, streamed for what's in view (large datasets)
type AreaSource =
  | { data: GeoJsonData; url?: never; tiles?: never }
  | { url: string; data?: never; tiles?: never }
  | { tiles: TileConfig; data?: never; url?: never };

export type AreaLayerProps = LayerProps &
  AreaSource & {
    // Drawn within another layer's areas: a stronger fill and border
    nested?: boolean;
  };

type Styles = ReturnType<typeof useAreaStyles>;
type SourceLayerProps = Omit<InteractiveLayerProps, "layer" | "hoverStyle"> & {
  styles: Styles;
};

// Shapes (polygons and lines; points draw as dots) filled in `color`. Stack
// several in one FeatureMap, each with its own color, tooltip and details.
export function AreaLayer({
  data,
  url,
  tiles,
  color,
  nested,
  ...props
}: AreaLayerProps) {
  const styles = useAreaStyles(color, nested);
  return tiles ? (
    <TileAreas url={tiles.url} styles={styles} color={color} {...props} />
  ) : (
    <GeoJsonAreas
      data={data}
      url={url}
      styles={styles}
      color={color}
      {...props}
    />
  );
}

function GeoJsonAreas({
  data,
  url,
  styles,
  ...props
}: SourceLayerProps & { data?: GeoJsonData; url?: string }) {
  const layer = useGeoJsonLayer(useLayerData(data, url), styles.base);
  return <InteractiveLayer layer={layer} hoverStyle={styles.hover} {...props} />;
}

function TileAreas({
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
