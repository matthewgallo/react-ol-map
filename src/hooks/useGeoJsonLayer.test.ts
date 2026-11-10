import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { get as getProjection } from "ol/proj";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import { Style } from "ol/style";
import type { FeatureCollection } from "geojson";
import { featuresInView } from "../utils/featuresInView";
import type { FeatureFilter } from "../types";
import { useGeoJsonLayer } from "./useGeoJsonLayer";

const style = new Style();

// Two points in Tucson about a kilometer apart, and one in Phoenix
const data: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    ["a", "tucson", -110.97, 32.22],
    ["b", "tucson", -110.96, 32.22],
    ["c", "phoenix", -112.07, 33.45],
  ].map(([name, city, lon, lat]) => ({
    type: "Feature",
    properties: { name, city },
    geometry: { type: "Point", coordinates: [lon as number, lat as number] },
  })),
};

const WORLD = [-2e7, -2e7, 2e7, 2e7];
// Meters per pixel: the Tucson points cluster, Phoenix stays apart
const RESOLUTION = 500;

const clusterSizes = (source: Cluster) => {
  source.loadFeatures(WORLD, RESOLUTION, getProjection("EPSG:3857")!);
  return source
    .getFeatures()
    .map((f) => (f.get("features") as unknown[]).length)
    .sort();
};

describe("useGeoJsonLayer", () => {
  it("draws every point unless clustering is on", () => {
    const { result } = renderHook(() => useGeoJsonLayer(data, style));
    const source = result.current?.getSource();
    expect(source).toBeInstanceOf(VectorSource);
    expect(source).not.toBeInstanceOf(Cluster);
    expect(source?.getFeatures()).toHaveLength(3);
  });

  it("groups nearby points when clustering is on", () => {
    const { result } = renderHook(() => useGeoJsonLayer(data, style, true));
    const source = result.current?.getSource() as Cluster;
    expect(source.getDistance()).toBe(40);
    expect(clusterSizes(source)).toEqual([1, 2]);
  });

  it("takes a custom distance", () => {
    const { result } = renderHook(() =>
      useGeoJsonLayer(data, style, { distance: 1, minDistance: 1 }),
    );
    const source = result.current?.getSource() as Cluster;
    expect(source.getDistance()).toBe(1);
    expect(clusterSizes(source)).toEqual([1, 1, 1]);
  });

  it("leaves filtered out points out of the clusters and their counts", () => {
    const onlyA: FeatureFilter = (props) => props.name !== "b";
    const { result, rerender } = renderHook(
      ({ filter }: { filter?: FeatureFilter }) =>
        useGeoJsonLayer(data, style, true, filter),
      { initialProps: {} as { filter?: FeatureFilter } },
    );
    const source = result.current?.getSource() as Cluster;
    expect(clusterSizes(source)).toEqual([1, 2]);

    rerender({ filter: onlyA });
    expect(result.current?.getSource()).toBe(source);
    expect(clusterSizes(source)).toEqual([1, 1]);
  });

  it("gives the points behind the clusters as a layer's features", () => {
    const { result } = renderHook(() => useGeoJsonLayer(data, style, true));
    const layer = result.current!;
    clusterSizes(layer.getSource() as Cluster);
    const names = featuresInView(layer, WORLD, RESOLUTION).map((f) =>
      f.get("name"),
    );
    expect(names.sort()).toEqual(["a", "b", "c"]);
  });
});
