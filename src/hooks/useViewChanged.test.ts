import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import OLMap from "ol/Map";
import View from "ol/View";
import { useViewChanged } from "./useViewChanged";

const CENTER = [0, 0];

const makeMap = (zoom: number) =>
  new OLMap({ view: new View({ center: CENTER, zoom }) });

describe("useViewChanged", () => {
  it("is false at the default zoom and true once zoomed away", () => {
    const map = makeMap(9);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9));
    expect(result.current).toBe(false);

    act(() => map.getView().setZoom(11));
    expect(result.current).toBe(true);

    act(() => map.getView().setZoom(9));
    expect(result.current).toBe(false);
  });

  it("ignores tiny differences from the default zoom", () => {
    const map = makeMap(9);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9));
    act(() => map.getView().setZoom(9.00001));
    expect(result.current).toBe(false);
  });

  it("is true once panned away from the default center", () => {
    const map = makeMap(9);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9));
    const resolution = map.getView().getResolution()!;

    act(() => map.getView().setCenter([100 * resolution, 0]));
    expect(result.current).toBe(true);

    act(() => map.getView().setCenter(CENTER));
    expect(result.current).toBe(false);
  });

  it("ignores small pans, measured in screen pixels", () => {
    const map = makeMap(9);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9));
    const resolution = map.getView().getResolution()!;
    act(() => map.getView().setCenter([5 * resolution, 5 * resolution]));
    expect(result.current).toBe(false);
  });

  it("follows a replaced view", () => {
    const map = makeMap(2);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9));
    expect(result.current).toBe(true);

    const view = new View({ center: CENTER, zoom: 9 });
    act(() => map.setView(view));
    expect(result.current).toBe(false);

    act(() => view.setZoom(10));
    expect(result.current).toBe(true);
  });

  it("is false when disabled", () => {
    const map = makeMap(2);
    const { result } = renderHook(() => useViewChanged(map, CENTER, 9, false));
    expect(result.current).toBe(false);
  });
});
