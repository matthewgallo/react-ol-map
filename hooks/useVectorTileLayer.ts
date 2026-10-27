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
) => {
  const highlightRef = useRef<VectorTileLayer | null>(null);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    highlightRef.current?.changed();
  }, [selectedId]);
  useEffect(() => {
    if (!map || !tiles) return;

    const source = new PMTilesVectorSource({ url: tiles.url });
    const base = new VectorTileLayer({ source, style });

    let hoveredId: string | number | undefined;
    const highlight = new VectorTileLayer({
      source,
      renderMode: "vector",
      zIndex: 10,
      style: (f) => {
        const id = idOf(f);
        if (id === undefined) return undefined;
        return id === hoveredId || id === selectedIdRef.current
          ? hoverStyle
          : undefined;
      },
    });

    highlightRef.current = highlight;

    map.addLayer(base);
    map.addLayer(highlight);

    const targetEl = map.getTargetElement();
    const setHovered = (id: string | number | undefined) => {
      if (id === hoveredId) return;
      hoveredId = id;
      highlight.changed(); // re-run the style function
      if (targetEl) targetEl.style.cursor = id !== undefined ? "pointer" : "";
    };

    const onMove = (evt: { dragging: boolean; pixel: number[] }) => {
      if (!highlightOnHover) return;
      if (evt.dragging) return setHovered(undefined);
      const [hit] = map.getFeaturesAtPixel(evt.pixel, {
        layerFilter: (l) => l === base, // avoid hitting our own highlight layer
      });
      setHovered(hit ? idOf(hit) : undefined);
    };
    const onLeave = () => setHovered(undefined);

    map.on("pointermove", onMove as never);
    targetEl?.addEventListener("pointerleave", onLeave);

    return () => {
      map.un("pointermove", onMove as never);
      targetEl?.removeEventListener("pointerleave", onLeave);
      map.removeLayer(base);
      map.removeLayer(highlight);
      if (targetEl) targetEl.style.cursor = "";
      highlightRef.current = null;
    };
  }, [map, tiles, style, hoverStyle, highlightOnHover]);
};
