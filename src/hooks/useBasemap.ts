import { useEffect, useState, useSyncExternalStore } from "react";
import XYZ from "ol/source/XYZ";

// The tiles drawn beneath the layers
export interface Basemap {
  // XYZ tile URL template, in the light or dark style
  url: (dark: boolean) => string;
  attributions?: string;
  maxZoom?: number;
}

// CARTO's Positron and Dark Matter basemaps
export const cartoBasemap = (apiKey?: string): Basemap => ({
  url: (dark) =>
    `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png${apiKey ? `?key=${apiKey}` : ""}`,
  attributions:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 20,
});

export type Appearance = "light" | "dark";

// Radix Themes and theme libraries such as next-themes mark dark mode with a
// class on <html>
const DARK_CLASSES = ["dark", "dark-theme"];
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};
const isDarkPage = () =>
  DARK_CLASSES.some((c) => document.documentElement.classList.contains(c));

// A basemap source that follows the light/dark appearance: the given one, or
// the page's when unset
export const useBasemap = (
  basemap: Basemap,
  appearance: Appearance | undefined,
) => {
  const pageDark = useSyncExternalStore(subscribe, isDarkPage, () => false);
  const isDark = appearance ? appearance === "dark" : pageDark;
  const url = basemap.url(isDark);

  const [source] = useState(
    () =>
      new XYZ({
        url,
        attributions: basemap.attributions,
        attributionsCollapsible: false,
        maxZoom: basemap.maxZoom ?? 20,
      }),
  );
  useEffect(() => {
    source.setUrl(url);
  }, [url, source]);

  return source;
};
