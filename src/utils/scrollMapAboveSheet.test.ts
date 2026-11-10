import { describe, expect, it } from "vitest";
import { placeAboveSheet } from "./scrollMapAboveSheet";

// A 100px header and a sheet from 500px down; the page scrolls freely
const place = (top: number, height: number, min = -1000, max = 1000) =>
  placeAboveSheet({ top, height }, 100, 500, min, max);

describe("placeAboveSheet", () => {
  it("leaves a map that already shows in full", () => {
    expect(place(150, 300)).toEqual({
      scroll: 0,
      coveredTop: 0,
      coveredBottom: 0,
    });
  });

  it("scrolls a map under the sheet up just above it", () => {
    expect(place(400, 300)).toEqual({
      scroll: 200,
      coveredTop: 0,
      coveredBottom: 0,
    });
  });

  it("scrolls a map under the header down just below it", () => {
    expect(place(20, 300).scroll).toBe(-80);
  });

  it("lines a map taller than the space up under the header", () => {
    expect(place(300, 500)).toEqual({
      scroll: 200,
      coveredTop: 0,
      coveredBottom: 100,
    });
  });

  it("reports what stays covered when the page can't scroll far enough", () => {
    expect(place(400, 300, 0, 50)).toEqual({
      scroll: 50,
      coveredTop: 0,
      coveredBottom: 150,
    });
  });
});
