import { describe, expect, it } from "vitest";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import { pickFeatures } from "./pickFeatures";

const square = (id: string, x: number, y: number, size = 10) => {
  const f = new Feature(
    new Polygon([
      [
        [x, y],
        [x + size, y],
        [x + size, y + size],
        [x, y + size],
        [x, y],
      ],
    ]),
  );
  f.setId(id);
  return f;
};

const point = (id: string, x: number, y: number) => {
  const f = new Feature(new Point([x, y]));
  f.setId(id);
  return f;
};

describe("pickFeatures", () => {
  it("prefers features that contain the coordinate", () => {
    const outside = square("outside", 100, 100);
    const inside = square("inside", 0, 0);
    expect(pickFeatures([outside, inside], [5, 5], 1)).toEqual([inside]);
  });

  it("keeps a point ahead of the area beneath it", () => {
    const pin = point("pin", 5, 5);
    const area = square("area", 0, 0);
    expect(pickFeatures([pin, area], [5, 5], 1)).toEqual([pin]);
  });

  it("falls back to every hit when none contain the coordinate", () => {
    const edge = square("edge", 0, 0);
    expect(pickFeatures([edge], [50, 50], 1)).toEqual([edge]);
  });

  it("drops duplicate ids and respects the limit", () => {
    const a = square("a", 0, 0);
    const aAgain = square("a", 0, 0);
    const b = square("b", 0, 0);
    expect(pickFeatures([a, aAgain, b], [5, 5], 5)).toEqual([a, b]);
    expect(pickFeatures([a, b], [5, 5], 1)).toEqual([a]);
  });
});
