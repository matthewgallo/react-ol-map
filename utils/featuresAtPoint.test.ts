import { describe, expect, it } from "vitest";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorTileLayer from "ol/layer/VectorTile";
import RenderFeature from "ol/render/Feature";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import { featuresAtPoint } from "./featuresAtPoint";

const point = (name: string, x: number, y: number, hidden = false) =>
  new Feature({ geometry: new Point([x, y]), name, hidden });

const layerOf = (...features: Feature[]) =>
  new VectorLayer({
    source: new VectorSource({ features }),
    style: (f) => (f.get("hidden") ? undefined : new Style()),
  });

const names = (features: { get(key: string): unknown }[]) =>
  features.map((f) => f.get("name"));

describe("featuresAtPoint", () => {
  it("returns the points drawn on the same spot, the given one first", () => {
    const high = point("high", 50, 50);
    const elementary = point("elementary", 50, 50);
    const nearby = point("nearby", 50.5, 50); // within a pixel
    const apart = point("apart", 60, 50);
    const layer = layerOf(elementary, high, nearby, apart);
    expect(names(featuresAtPoint(layer, high, 1))).toEqual([
      "high",
      "elementary",
      "nearby",
    ]);
  });

  it("leaves out points the layer's style doesn't draw", () => {
    const shown = point("shown", 50, 50);
    const hidden = point("hidden", 50, 50, true);
    const layer = layerOf(shown, hidden);
    expect(names(featuresAtPoint(layer, shown, 1))).toEqual(["shown"]);
  });

  it("returns other geometry alone", () => {
    const square = new Feature({
      geometry: new Polygon([[[0, 0], [100, 0], [100, 100], [0, 0]]]),
      name: "square",
    });
    const layer = layerOf(square, point("inside", 50, 50));
    expect(names(featuresAtPoint(layer, square, 1))).toEqual(["square"]);
  });

  it("matches tile points by id, not by piece", () => {
    const piece = (id: number, x: number) =>
      new RenderFeature("Point", [x, 10], [2], 2, { name: `f${id}` }, id);
    const hovered = piece(1, 10);
    const layer = new VectorTileLayer({ style: new Style() });
    // The hovered point's piece in a neighboring tile, and another point
    layer.getFeaturesInExtent = () => [piece(1, 10), piece(2, 10), hovered];
    expect(names(featuresAtPoint(layer, hovered, 1))).toEqual(["f1", "f2"]);
  });
});
