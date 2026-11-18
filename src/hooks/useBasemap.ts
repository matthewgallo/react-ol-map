import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type OLMap from "ol/Map";
import TileLayer from "ol/layer/Tile";
import type TileSource from "ol/source/Tile";
import XYZ from "ol/source/XYZ";
import { useMapLayer } from "./useMapLayer";

// The tiles drawn beneath the layers: XYZ raster tiles, from a URL template in
// the light or dark style
export interface Basemap {
  url: (dark: boolean) => string;
  attributions?: string;
  maxZoom?: number;
}

// Any OpenLayers tile source (WMTS, TileWMS, OSM, StadiaMaps, ...) for the
// light or dark style. It's called again when the appearance changes, and the
// map disposes of the sources it's done with. Define it outside render (or
// memoize it), as a new function makes a new source.
export interface SourceBasemap {
  source: (dark: boolean) => TileSource;
}

// What FeatureMap's `basemap` takes: a URL basemap or a custom source
export type BasemapOption = Basemap | SourceBasemap;

const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// CARTO's Positron and Dark Matter basemaps
export const cartoBasemap = (apiKey?: string): Basemap => ({
  url: (dark) =>
    `https://{a-d}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}.png${apiKey ? `?key=${apiKey}` : ""}`,
  attributions: `${OSM_ATTRIBUTION} © <a href="https://carto.com/attributions">CARTO</a>`,
  maxZoom: 20,
});

// OpenStreetMap's standard tiles, the same in light and dark. Its tile usage
// policy rules out heavy use: https://operations.osmfoundation.org/policies/tiles/
export const osmBasemap = (): Basemap => ({
  url: () => "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attributions: OSM_ATTRIBUTION,
  maxZoom: 19,
});

// Stadia Maps' Alidade Smooth and Alidade Smooth Dark. Works without a key on
// localhost; elsewhere, pass one or allow your domain in Stadia.
export const stadiaBasemap = (apiKey?: string): Basemap => ({
  url: (dark) =>
    `https://tiles.stadiamaps.com/tiles/${dark ? "alidade_smooth_dark" : "alidade_smooth"}/{z}/{x}/{y}.png${apiKey ? `?api_key=${apiKey}` : ""}`,
  attributions: `© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> ${OSM_ATTRIBUTION}`,
  maxZoom: 20,
});

// Esri's Light Gray Canvas and Dark Gray Canvas. No key needed, though Esri
// expects production apps to have an ArcGIS account. Tiles stop at zoom 16 and
// are scaled up beyond it.
export const esriGrayBasemap = (): Basemap => ({
  url: (dark) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? "Dark" : "Light"}_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
  attributions: `Tiles © <a href="https://www.esri.com">Esri</a> — Esri, HERE, Garmin, ${OSM_ATTRIBUTION}`,
  maxZoom: 16,
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

// Beneath every other layer, whatever zIndex they're given
const BASEMAP_Z_INDEX = Number.MIN_SAFE_INTEGER;

// Adds the basemap layer to the map, following the light/dark appearance: the
// given one, or the page's when unset. Switching to another provider swaps
// the tile source, so its attributions and max zoom apply too.
export const useBasemap = (
  map: OLMap | null | undefined,
  basemap: BasemapOption,
  appearance: Appearance | undefined,
) => {
  const pageDark = useSyncExternalStore(subscribe, isDarkPage, () => false);
  const isDark = appearance ? appearance === "dark" : pageDark;
  const custom = "source" in basemap ? basemap.source : undefined;
  const xyz = "url" in basemap ? basemap : undefined;
  const url = xyz?.url(isDark);
  const attributions = xyz?.attributions;
  const maxZoom = xyz?.maxZoom ?? 20;

  const [layer] = useState(() => new TileLayer<TileSource>());
  // A custom source is made again for each appearance
  const customSource = useMemo(() => custom?.(isDark), [custom, isDark]);
  // Keyed on the values rather than the object, so an inline `basemap` doesn't
  // rebuild the source on every render. The URL is set below, so a light/dark
  // switch keeps the source and its loaded tiles.
  const xyzSource = useMemo(
    () =>
      custom
        ? undefined
        : new XYZ({ attributions, attributionsCollapsible: false, maxZoom }),
    [custom, attributions, maxZoom],
  );
  const source = customSource ?? xyzSource;

  useEffect(() => {
    if (url) xyzSource?.setUrl(url);
  }, [xyzSource, url]);
  useEffect(() => {
    if (!source) return;
    layer.setSource(source);
    return () => source.dispose();
  }, [layer, source]);

  useMapLayer(map, layer, BASEMAP_Z_INDEX);
  return layer;
};
