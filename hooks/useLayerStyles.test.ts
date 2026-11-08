import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Circle, Icon, Style } from "ol/style";
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
    for (const style of [result.current.base as Style, ...result.current.hover]) {
      expect((style.getImage() as Circle).getDeclutterMode()).toBe("none");
    }
  });

  it("fills shaded areas more strongly the higher their value", () => {
    const shade = { key: "count", steps: [1, 5] };
    const { result } = renderHook(() => useAreaStyles("iris", false, shade));
    const base = result.current.base as StyleFunction;
    const alphaOf = (count: unknown) => {
      const style = base(new Feature({ count }), 1) as Style;
      expect((style.getImage() as Circle).getDeclutterMode()).toBe("none");
      const fill = String(style.getFill()?.getColor());
      return Number(fill.match(/([\d.]+)\)$/)?.[1]);
    };
    expect(alphaOf(0)).toBeLessThan(alphaOf(1));
    expect(alphaOf(1)).toBeLessThan(alphaOf(5));
    expect(alphaOf(5)).toBe(alphaOf(40));
  });
});

describe("useAreaStyles with noData", () => {
  it("draws areas without a value apart from the lowest class", () => {
    const shade = { key: "count", steps: [10], noData: true };
    const { result } = renderHook(() => useAreaStyles("iris", false, shade));
    const base = result.current.base as StyleFunction;
    const styleOf = (count?: unknown) =>
      base(new Feature(count === undefined ? {} : { count }), 1) as Style;
    expect(styleOf()).not.toBe(styleOf(0));
    expect(styleOf("")).toBe(styleOf());
    expect(styleOf(5)).toBe(styleOf(0));
  });

  it("draws them in the lowest class without it", () => {
    const shade = { key: "count", steps: [10] };
    const { result } = renderHook(() => useAreaStyles("iris", false, shade));
    const base = result.current.base as StyleFunction;
    expect(base(new Feature({}), 1)).toBe(base(new Feature({ count: 0 }), 1));
  });
});

describe("useAreaStyles without fill", () => {
  it("outlines areas, hovered and selected ones too, without filling them", () => {
    const { result } = renderHook(() =>
      useAreaStyles("iris", false, { key: "count", steps: [1] }, false),
    );
    const base = result.current.base as StyleFunction;
    const style = base(new Feature({ count: 5 }), 1) as Style;
    expect(style.getFill()).toBeNull();
    expect(style.getStroke()).not.toBeNull();
    for (const hover of result.current.hover) {
      expect(hover.getFill()).toBeNull();
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
