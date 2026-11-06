import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Circle, Icon } from "ol/style";
import Feature from "ol/Feature";
import type { StyleFunction } from "ol/style/Style";
import {
  useAreaStyles,
  useFilteredStyles,
  usePinStyles,
} from "./useLayerStyles";

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

describe("usePinStyles", () => {
  // The same hit detection issue applies to pins in a tiled MarkerLayer
  it("keeps pins out of decluttering so tile points stay hittable", () => {
    const { result } = renderHook(() => usePinStyles());
    for (const style of [result.current.base, ...result.current.hover]) {
      expect((style.getImage() as Icon).getDeclutterMode()).toBe("none");
    }
  });
});

describe("useFilteredStyles", () => {
  it("styles only the features the filter accepts", () => {
    const { result } = renderHook(() => {
      const styles = useAreaStyles();
      return { styles, filtered: useFilteredStyles(styles, (p) => !!p.keep) };
    });
    const { styles, filtered } = result.current;
    const style = filtered.base as StyleFunction;
    expect(style(new Feature({ keep: true }), 1)).toBe(styles.base);
    expect(style(new Feature({ keep: false }), 1)).toBeUndefined();
    expect(filtered.hover).toBe(styles.hover);
  });

  it("returns the styles unchanged without a filter", () => {
    const { result } = renderHook(() => {
      const styles = useAreaStyles();
      return { styles, filtered: useFilteredStyles(styles, undefined) };
    });
    expect(result.current.filtered).toBe(result.current.styles);
  });
});
