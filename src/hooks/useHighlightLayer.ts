import { useEffect, useMemo } from "react";
import type OLMap from "ol/Map";
import type { FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import { keyOf, type VectorBaseLayer } from "../types";
import { clusterMembers } from "../utils/cluster";
import { useMapLayer } from "./useMapLayer";

// Draws the hovered and selected features of `base` again in `style`, on a
// layer of their own that shares its source. Works the same for GeoJSON and
// tiles (which can't be restyled per feature), and draws above the layers
// stacked between the base and `zIndex`.
export const useHighlightLayer = (
  map: OLMap | null | undefined,
  base: VectorBaseLayer | undefined,
  style: StyleLike,
  zIndex: number,
  visible: boolean,
  hovered: FeatureLike | undefined,
  selected: FeatureLike | undefined,
) => {
  const layer = useMemo(() => {
    if (base instanceof VectorTileLayer) {
      return new VectorTileLayer({
        source: base.getSource() ?? undefined,
        renderMode: "vector", // per-feature styles; hybrid mode caches them
      });
    }
    if (base instanceof VectorLayer) {
      return new VectorLayer({ source: base.getSource() ?? undefined });
    }
    return undefined;
  }, [base]);

  useMapLayer(map, layer, zIndex, visible);

  useEffect(() => {
    if (!layer) return;
    const keys = new Set(
      [hovered, selected].flatMap((f) => (f ? [keyOf(f)] : [])),
    );
    // Hits name a cluster's point rather than a cluster of one, and a
    // selected point can be swept into a cluster by zooming out
    const matches = (f: FeatureLike) =>
      keys.has(keyOf(f)) ||
      !!clusterMembers(f)?.some((member) => keys.has(keyOf(member)));
    // Features without a style aren't drawn, so everything else stays hidden
    layer.setStyle((f, resolution) => {
      if (!matches(f)) return undefined;
      return typeof style === "function" ? style(f, resolution) : style;
    });
  }, [layer, style, hovered, selected]);
};
