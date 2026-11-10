import { FeatureMap, cartoBasemap, type FeatureMapProps } from "../../src";
import { SPANISH_LABELS, useLocale } from "./locale";

// CARTO's basemap with the key from .env.local, as folklorico passes its
// VITE_MAP_KEY. Without one, CARTO draws "API KEY REQUIRED" tiles.
const basemap = cartoBasemap(import.meta.env.VITE_MAP_KEY);

// FeatureMap as folklorico renders it (its src/components/map adapter), in the
// toolbar's language. The basemap follows the toolbar's theme through the
// "dark" class on <html>. Sized like the site's: square, up to 600px tall.
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
