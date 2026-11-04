import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Circle } from "ol/style";
import { useAreaStyles } from "./useLayerStyles";

describe("useAreaStyles", () => {
  // Without it, OpenLayers' vector tile hit detection drops points drawn as
  // dots, so they get no hover, tooltip or click (see useAreaStyles)
  it("keeps point dots out of decluttering so tile points stay hittable", () => {
    const { result } = renderHook(() => useAreaStyles());
    for (const style of [result.current.base, ...result.current.hover]) {
      expect((style.getImage() as Circle).getDeclutterMode()).toBe("none");
    }
  });
});
