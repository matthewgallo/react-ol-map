import { describe, expect, it } from "vitest";
import { layerColorStyle } from "./layerColor";

const layerColor = (style: object) =>
  (style as Record<string, string>)["--layer-color"];

describe("layerColorStyle", () => {
  // A theme variable rather than a resolved color, so it follows light and
  // dark without re-rendering, matching the layer's outlines (step 9)
  it("references the layer's outline step of its Radix scale", () => {
    expect(layerColor(layerColorStyle("grass"))).toBe("var(--grass-9)");
  });

  it("defaults to the theme's accent color", () => {
    expect(layerColor(layerColorStyle())).toBe("var(--accent-9)");
  });

  // An alpha step, so the panel shows through it in light and dark
  it("sets a soft tint of the same scale", () => {
    const style = layerColorStyle("blue") as Record<string, string>;
    expect(style["--layer-tint"]).toBe("var(--blue-a3)");
  });
});
