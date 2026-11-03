import { useEffect, useId } from "react";
import { useFeatureMap } from "../context";
import { useGeoJson } from "../../../hooks/useGeoJson";
import type { GeoJsonData } from "../types";

// GeoJSON given inline (`data`) or fetched from `url`. While fetching, or if
// it fails, the enclosing FeatureMap shows a loading or error state.
export const useLayerData = (data?: GeoJsonData, url?: string) => {
  const id = useId();
  const { setStatus } = useFeatureMap();
  const fetched = useGeoJson(data ? undefined : url);

  const status = fetched.error
    ? "error"
    : url && !data && !fetched.data
      ? "loading"
      : undefined;
  useEffect(() => {
    if (!status) return;
    setStatus(id, status);
    return () => setStatus(id, undefined);
  }, [setStatus, id, status]);

  return data ?? (fetched.data as GeoJsonData | null) ?? undefined;
};
