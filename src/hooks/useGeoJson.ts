import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

// Skips fetching when `url` is undefined
export function useGeoJson(url: string | undefined) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
        return res.json() as Promise<FeatureCollection>;
      })
      .then(setData)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e);
      });
    return () => controller.abort();
  }, [url]);

  return { data, error };
}
