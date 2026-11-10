import { useFeatureMap } from "./context";
import {
  InteractiveLayer,
  type InteractiveLayerProps,
} from "./interactive-layer";
import {
  useAreaStyles,
  useClusterStyles,
  useFilteredStyles,
  type LayerStyles,
} from "./hooks/useLayerStyles";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useLayerData } from "./hooks/useLayerData";
import {
  useTileExtent,
  useVectorTileLayer,
  type TileConfig,
} from "./hooks/useVectorTileLayer";
import type { ClusterOption, GeoJsonData, LayerProps } from "./types";
import type { Shade } from "./utils/shade";

// One way to load the features, each suited to a different size:
// - data: inline GeoJSON, loaded all at once
// - url: GeoJSON fetched from a URL, loaded all at once
// - tiles: vector tiles, streamed for what's in view (large datasets)
// Only GeoJSON can `cluster`: tiles only hold the points in view. A clustered
// layer draws only its points, leaving out any polygons and lines.
type AreaSource =
  | { data: GeoJsonData; url?: never; tiles?: never; cluster?: ClusterOption }
  | { url: string; data?: never; tiles?: never; cluster?: ClusterOption }
  | { tiles: TileConfig; data?: never; url?: never; cluster?: never };

export type AreaLayerProps = LayerProps &
  AreaSource & {
    // Drawn within another layer's areas: a stronger fill and border
    nested?: boolean;
    // Fills each area more strongly the higher its value, by steps
    shade?: Shade;
    // false draws the areas as outlines only, hovered and selected ones too,
    // such as while shaded areas are drawn over them. Defaults to true.
    // Unfilled areas can only be hovered and clicked along their outlines.
    fill?: boolean;
  };

type SourceLayerProps = Omit<InteractiveLayerProps, "layer" | "hoverStyle"> & {
  styles: LayerStyles;
};

// Shapes (polygons and lines; points draw as dots) filled in `color`. Stack
// several in one FeatureMap, each with its own color, tooltip and details.
export function AreaLayer({
  data,
  url,
  tiles,
  cluster,
  color,
  nested,
  shade,
  fill,
  filter,
  ...props
}: AreaLayerProps) {
  const styles = useFilteredStyles(
    useClusterStyles(useAreaStyles(color, nested, shade, fill), !!cluster, color),
    cluster ? undefined : filter, // clusters leave out what it rejects instead
  );
  return tiles ? (
    <TileAreas url={tiles.url} styles={styles} color={color} {...props} />
  ) : (
    <GeoJsonAreas
      data={data}
      url={url}
      cluster={cluster}
      styles={styles}
      color={color}
      filter={filter}
      {...props}
    />
  );
}

function GeoJsonAreas({
  data,
  url,
  cluster,
  styles,
  filter,
  ...props
}: SourceLayerProps & {
  data?: GeoJsonData;
  url?: string;
  cluster?: ClusterOption;
}) {
  const layer = useGeoJsonLayer(
    useLayerData(data, url),
    styles.base,
    cluster,
    filter,
  );
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
