import { useState } from "react";
import { useFeatureMap } from "../context";
import type { Hit } from "../types";

// The last feature selected on the layer `layerId`, kept after the selection
// moves to another layer, such as to link back to it
export const useLastSelected = (layerId: string | undefined) => {
  const { selected } = useFeatureMap();
  const [last, setLast] = useState<Hit>();
  if (layerId && selected?.layerId === layerId && selected !== last) {
    setLast(selected);
  }
  return layerId ? last : undefined;
};
