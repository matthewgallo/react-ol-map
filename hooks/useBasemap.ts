import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import XYZ from "ol/source/XYZ";

const apiKey = import.meta.env.VITE_MAP_KEY;
const tileUrl = (dark: boolean) =>
  `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png?key=${apiKey}`;

const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

// CARTO basemap source that follows the light/dark theme
export const useBasemap = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [basemap] = useState(
    () =>
      new XYZ({
        url: tileUrl(isDark),
        attributions: ATTRIBUTION,
        attributionsCollapsible: false,
        maxZoom: 20,
      }),
  );
  useEffect(() => {
    basemap.setUrl(tileUrl(isDark));
  }, [isDark, basemap]);

  return basemap;
};
