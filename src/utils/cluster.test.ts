import { describe, expect, it, vi } from "vitest";
import Feature from "ol/Feature";
import type OLMap from "ol/Map";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import Cluster from "ol/source/Cluster";
import VectorSource from "ol/source/Vector";
import {
  clusterMembers,
  isCluster,
  unwrapCluster,
  zoomToCluster,
} from "./cluster";

const point = (x: number, y = 0) => new Feature(new Point([x, y]));
const clusterOf = (...features: Feature[]) =>
  new Feature({ geometry: new Point([0, 0]), features });

const padding = () => [48, 48, 48, 48];

const setup = (distance = 40) => {
  const layer = new VectorLayer({ source: new Cluster({ distance }) });
  const view = {
    // About what zoom 18 is in Web Mercator
    getResolutionForZoom: () => 0.6,
    fit: vi.fn(),
  };
  const map = { getView: () => view } as unknown as OLMap;
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  return { layer, view, map };
};

describe("clusterMembers", () => {
  it("gives a cluster's features, and nothing for other features", () => {
    const a = point(0);
    expect(clusterMembers(clusterOf(a))).toEqual([a]);
    expect(clusterMembers(a)).toBeUndefined();
  });

  it("ignores a plain feature with a property named features", () => {
    expect(clusterMembers(new Feature({ features: ["pool"] }))).toBeUndefined();
  });
});

describe("isCluster", () => {
  it("only counts clusters of several points", () => {
    expect(isCluster(clusterOf(point(0), point(1)))).toBe(true);
    expect(isCluster(clusterOf(point(0)))).toBe(false);
    expect(isCluster(point(0))).toBe(false);
  });
});

describe("unwrapCluster", () => {
  it("swaps a cluster of one for its point and keeps anything else", () => {
    const a = point(0);
    const several = clusterOf(point(0), point(1));
    expect(unwrapCluster(clusterOf(a))).toBe(a);
    expect(unwrapCluster(several)).toBe(several);
    expect(unwrapCluster(a)).toBe(a);
  });
});

describe("zoomToCluster", () => {
  it("fits the view to a cluster's points", () => {
    const { layer, view, map } = setup();
    const zoomed = zoomToCluster(
      map,
      layer,
      clusterOf(point(0), point(1000, 500)),
      padding,
    );
    expect(zoomed).toBe(true);
    expect(view.fit).toHaveBeenCalledOnce();
    expect(view.fit.mock.calls[0][0]).toEqual([0, 0, 1000, 500]);
  });

  it("leaves points too close to separate for their details", () => {
    const { layer, view, map } = setup();
    // 10 m is about 17 px at the closest zoom, inside the 40 px distance
    const zoomed = zoomToCluster(map, layer, clusterOf(point(0), point(10)), padding);
    expect(zoomed).toBe(false);
    expect(view.fit).not.toHaveBeenCalled();
  });

  it("ignores features of layers that don't cluster", () => {
    const { view, map } = setup();
    const layer = new VectorLayer({ source: new VectorSource() });
    expect(zoomToCluster(map, layer, point(0), padding)).toBe(false);
    expect(view.fit).not.toHaveBeenCalled();
  });
});
