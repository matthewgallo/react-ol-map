import { useEffect, useRef } from "react";
import type OLMap from "ol/Map";
import type { FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";
import type { Style } from "ol/style";
import VectorTileLayer from "ol/layer/VectorTile";
import { PMTilesVectorSource } from "ol-pmtiles";

export interface TileConfig {
  url: string; // URL of the .pmtiles/vector file
}

const idOf = (f: FeatureLike) => f.getId();

export const useVectorTileLayer = (
  map: OLMap | null | undefined,
  tiles: TileConfig | undefined,
  style: StyleLike,
  hoverStyle: Style,
  highlightOnHover: boolean,
  selectedId?: string | number,
  visible = true,
) => {
  const baseRef = useRef<VectorTileLayer | null>(null);
  const highlightRef = useRef<VectorTileLayer | null>(null);
  const selectedIdRef = useRef(selectedId);
  const visibleRef = useRef(visible);

  // Declared before the layer effect so recreated layers start with this value
  useEffect(() => {
    visibleRef.current = visible;
    baseRef.current?.setVisible(visible);
    highlightRef.current?.setVisible(visible);
  }, [visible]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    highlightRef.current?.changed();
  }, [selectedId]);
  useEffect(() => {
    if (!map || !tiles) return;

    const source = new PMTilesVectorSource({ url: tiles.url });
    const base = new VectorTileLayer({
      source,
      style,
      visible: visibleRef.current,
    });

    let hoveredId: string | number | undefined;
    const highlight = new VectorTileLayer({
      source,
      renderMode: "vector",
      zIndex: 10,
      visible: visibleRef.current,
      style: (f) => {
        const id = idOf(f);
        if (id === undefined) return undefined;
        return id === hoveredId || id === selectedIdRef.current
          ? hoverStyle
          : undefined;
      },
    });

    baseRef.current = base;
    highlightRef.current = highlight;

    map.addLayer(base);
    map.addLayer(highlight);

    const targetEl = map.getTargetElement();
    const setHovered = (id: string | number | undefined) => {
      if (id === hoveredId) return;
      hoveredId = id;
      highlight.changed(); // re-run the style function
    };

    const onMove = (evt: { dragging: boolean; pixel: number[] }) => {
      if (!highlightOnHover) return;
      if (evt.dragging) return setHovered(undefined);
      // Only the top-most feature counts, so a tile under an overlaid marker
      // isn't highlighted along with it
      const top = map.forEachFeatureAtPixel(
        evt.pixel,
        (feature, layer) => ({ feature, layer }),
        { layerFilter: (l) => l !== highlight }, // skip our own highlight layer
      );
      setHovered(top?.layer === base ? idOf(top.feature) : undefined);
    };
    const onLeave = () => setHovered(undefined);

    map.on("pointermove", onMove as never);
    targetEl?.addEventListener("pointerleave", onLeave);

    return () => {
      map.un("pointermove", onMove as never);
      targetEl?.removeEventListener("pointerleave", onLeave);
      map.removeLayer(base);
      map.removeLayer(highlight);
      baseRef.current = null;
      highlightRef.current = null;
    };
  }, [map, tiles, style, hoverStyle, highlightOnHover]);
};
