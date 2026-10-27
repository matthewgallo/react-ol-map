import { useEffect } from "react";
import Feature, { type FeatureLike } from "ol/Feature";
import type { StyleLike } from "ol/style/Style";

export const useSelectedHighlight = (
  selected: FeatureLike | undefined,
  style: StyleLike,
) => {
  useEffect(() => {
    // tile features are handled in useVectorTileLayer
    if (!(selected instanceof Feature)) return;
    selected.setStyle(style);
    return () => selected.setStyle(undefined);
  }, [selected, style]);
};
