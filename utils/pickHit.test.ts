import { describe, expect, it } from "vitest";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import RenderFeature from "ol/render/Feature";
import { pickHit, sameHit } from "./pickHit";

const ring = (x: number, y: number, size: number) => [
  [x, y],
  [x + size, y],
  [x + size, y + size],
  [x, y + size],
  [x, y],
];

const square = (id: string, x: number, y: number, size = 10) => {
  const f = new Feature(new Polygon([ring(x, y, size)]));
  f.setId(id);
  return f;
};

const point = (id: string, x: number, y: number) => {
  const f = new Feature(new Point([x, y]));
  f.setId(id);
  return f;
};

// A vector tile feature, as returned by hit detection on tile layers
const tileSquare = (id: number, x: number, y: number, size = 10) =>
  new RenderFeature(
    "Polygon",
    ring(x, y, size).flat(),
    [10],
    2,
    {},
    id,
  );

describe("pickHit", () => {
  it("prefers features that contain the coordinate", () => {
    const outside = { layerId: "a", feature: square("outside", 100, 100) };
    const inside = { layerId: "a", feature: square("inside", 0, 0) };
    expect(pickHit([outside, inside], [5, 5])).toBe(inside);
  });

  it("keeps a point ahead of the area beneath it", () => {
    const pin = { layerId: "pins", feature: point("pin", 5, 5) };
    const area = { layerId: "areas", feature: square("area", 0, 0) };
    expect(pickHit([pin, area], [5, 5])).toBe(pin);
  });

  it("checks containment for tile features too", () => {
    const tileNeighbor = { layerId: "tiles", feature: tileSquare(1, 100, 100) };
    const below = { layerId: "areas", feature: square("below", 0, 0) };
    const tile = { layerId: "tiles", feature: tileSquare(2, 0, 0) };
    expect(pickHit([tileNeighbor, tile, below], [5, 5])).toBe(tile);
  });

  it("falls back to the top-most hit when none contain the coordinate", () => {
    const edge = { layerId: "a", feature: square("edge", 0, 0) };
    const other = { layerId: "b", feature: square("other", 0, 0) };
    expect(pickHit([edge, other], [50, 50])).toBe(edge);
  });

  it("returns undefined without hits", () => {
    expect(pickHit([], [0, 0])).toBeUndefined();
  });
});

describe("sameHit", () => {
  it("matches tile pieces of one feature by id", () => {
    const a = { layerId: "tiles", feature: tileSquare(1, 0, 0) };
    const b = { layerId: "tiles", feature: tileSquare(1, 10, 0) };
    expect(sameHit(a, b)).toBe(true);
  });

  it("tells apart the same id in different layers", () => {
    const a = { layerId: "neighborhoods", feature: tileSquare(1, 0, 0) };
    const b = { layerId: "subdivisions", feature: tileSquare(1, 0, 0) };
    expect(sameHit(a, b)).toBe(false);
    expect(sameHit(a, undefined)).toBe(false);
  });
});
