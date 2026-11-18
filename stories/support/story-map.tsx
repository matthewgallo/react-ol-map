import { FeatureMap, cartoBasemap, type FeatureMapProps } from "../../src";
import { SPANISH_LABELS, useLocale } from "./locale";

// CARTO's basemap with the VITE_MAP_KEY from .env.local. Without one, CARTO draws "API KEY REQUIRED" tiles.
const basemap = cartoBasemap(import.meta.env.VITE_MAP_KEY);

// FeatureMap in the toolbar's language. The basemap follows the toolbar's
// theme through the "dark" class on <html>. Square by default, up to 600px
// tall.
export function StoryMap(props: FeatureMapProps) {
  const locale = useLocale();
  return (
    <FeatureMap
      basemap={basemap}
      labels={locale === "es" ? SPANISH_LABELS : undefined}
      locale={locale}
      {...props}
    />
  );
}
