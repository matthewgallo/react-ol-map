import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import OLMap from "ol/Map";
import OSM from "ol/source/OSM";
import type XYZ from "ol/source/XYZ";
import {
  cartoBasemap,
  esriGrayBasemap,
  osmBasemap,
  stadiaBasemap,
  useBasemap,
  type Appearance,
  type BasemapOption,
} from "./useBasemap";

const osm = osmBasemap();

const sourceOf = (layer: { getSource: () => unknown }) =>
  layer.getSource() as XYZ;
type AttributionsArg = Parameters<
  NonNullable<ReturnType<XYZ["getAttributions"]>>
>[0];
const attributionsOf = (source: XYZ) =>
  source.getAttributions()?.({} as AttributionsArg);

// OpenLayers marks `disposed` protected
const isDisposed = (source: object) =>
  (source as unknown as { disposed: boolean }).disposed;

describe("useBasemap", () => {
  it("adds the basemap beneath every other layer", () => {
    const map = new OLMap({});
    const { result } = renderHook(() =>
      useBasemap(map, cartoBasemap(), "light"),
    );
    expect(map.getLayers().getArray()).toContain(result.current);
    expect(result.current.getZIndex()).toBeLessThan(-1e6);
  });

  it("switches the URL, attributions and max zoom with the provider", () => {
    const map = new OLMap({});
    const { result, rerender } = renderHook(
      ({ basemap }) => useBasemap(map, basemap, "light"),
      { initialProps: { basemap: cartoBasemap() } },
    );
    expect(sourceOf(result.current).getUrls()?.[0]).toContain("cartocdn");
    expect(sourceOf(result.current).getTileGrid()?.getMaxZoom()).toBe(20);

    rerender({ basemap: osm });
    const source = sourceOf(result.current);
    expect(source.getUrls()).toEqual([
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ]);
    expect(attributionsOf(source)?.[0]).toContain("OpenStreetMap");
    expect(source.getTileGrid()?.getMaxZoom()).toBe(19);
  });

  it("keeps the source when switching between light and dark", () => {
    const map = new OLMap({});
    const basemap = cartoBasemap();
    const { result, rerender } = renderHook(
      ({ appearance }) => useBasemap(map, basemap, appearance),
      { initialProps: { appearance: "light" as Appearance } },
    );
    const before = sourceOf(result.current);

    rerender({ appearance: "dark" });
    expect(sourceOf(result.current)).toBe(before);
    expect(before.getUrls()?.some((u) => u.includes("dark_all"))).toBe(true);
  });

  it("keeps the source when an equal basemap is passed inline", () => {
    const map = new OLMap({});
    const { result, rerender } = renderHook(() =>
      useBasemap(map, { ...osm }, "light"),
    );
    const before = sourceOf(result.current);
    rerender();
    expect(sourceOf(result.current)).toBe(before);
  });

  it("picks the dark style of the other presets", () => {
    expect(stadiaBasemap("k").url(true)).toBe(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png?api_key=k",
    );
    expect(esriGrayBasemap().url(true)).toContain("World_Dark_Gray_Base");
    expect(esriGrayBasemap().url(false)).toContain("World_Light_Gray_Base");
    expect(osm.url(true)).toBe(osm.url(false));
  });

  it("uses a custom source, made again for each appearance", () => {
    const map = new OLMap({});
    const made: { dark: boolean; source: OSM }[] = [];
    const basemap: BasemapOption = {
      source: (dark) => {
        const source = new OSM();
        made.push({ dark, source });
        return source;
      },
    };
    const { result, rerender, unmount } = renderHook(
      ({ appearance }) => useBasemap(map, basemap, appearance),
      { initialProps: { appearance: "light" as Appearance } },
    );
    expect(made.map((m) => m.dark)).toEqual([false]);
    expect(result.current.getSource()).toBe(made[0].source);

    rerender({ appearance: "light" });
    expect(made).toHaveLength(1);

    rerender({ appearance: "dark" });
    expect(made.map((m) => m.dark)).toEqual([false, true]);
    expect(result.current.getSource()).toBe(made[1].source);
    expect(isDisposed(made[0].source)).toBe(true);

    unmount();
    expect(isDisposed(made[1].source)).toBe(true);
  });

  it("switches between a URL basemap and a custom source", () => {
    const map = new OLMap({});
    const custom: BasemapOption = { source: () => new OSM() };
    const { result, rerender } = renderHook(
      ({ basemap }) => useBasemap(map, basemap, "light"),
      { initialProps: { basemap: cartoBasemap() as BasemapOption } },
    );
    const xyz = sourceOf(result.current);

    rerender({ basemap: custom });
    expect(result.current.getSource()).toBeInstanceOf(OSM);
    expect(isDisposed(xyz)).toBe(true);

    rerender({ basemap: osm });
    expect(sourceOf(result.current).getUrls()?.[0]).toContain(
      "tile.openstreetmap.org",
    );
  });
});
