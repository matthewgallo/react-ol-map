import { useCallback, useEffect, useMemo } from "react";
import type OLMap from "ol/Map";
import type { FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";
import { createEmpty, extend, isEmpty, type Extent } from "ol/extent";
import VectorTileLayer from "ol/layer/VectorTile";
import { PMTilesVectorSource } from "ol-pmtiles";

export interface TileConfig {
  url: string; // URL of the .pmtiles/vector file
}

// Creates a PMTiles vector tile layer, rebuilt only when the URL changes, so
// an inline `tiles={{ url }}` or a theme change doesn't refetch the tiles.
// Add it to the map with useMapLayer (InteractiveLayer does this).
export const useVectorTileLayer = (
  url: string | undefined,
  style: StyleLike,
) => {
  const layer = useMemo(
    () =>
      url
        ? new VectorTileLayer({ source: new PMTilesVectorSource({ url }) })
        : undefined,
    [url],
  );

  useEffect(() => {
    layer?.setStyle(style);
  }, [layer, style]);

  return layer;
};

// Features are clipped at tile boundaries, so a clicked feature only covers
// one tile. Combines its pieces from the loaded tiles in view instead.
export const useTileExtent = (
  map: OLMap | null | undefined,
  layer: VectorTileLayer | undefined,
) =>
  useCallback(
    (feature: FeatureLike): Extent | undefined => {
      const id = feature.getId();
      const size = map?.getSize();
      if (!map || !layer || !size || id === undefined) return undefined;
      const viewExtent = map.getView().calculateExtent(size);
      const extent = createEmpty();
      for (const f of layer.getFeaturesInExtent(viewExtent)) {
        if (f.getId() === id) extend(extent, f.getExtent());
      }
      return isEmpty(extent) ? undefined : extent;
    },
    [map, layer],
  );
