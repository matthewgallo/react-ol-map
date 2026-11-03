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
});
