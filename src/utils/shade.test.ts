import { describe, expect, it } from "vitest";
import {
  hasValue,
  formatBoundsRange,
  formatCountRange,
  shadeAlphas,
  shadeClass,
  shadeClasses,
  withAlpha,
} from "./shade";

const steps = [1, 2, 5, 13];

describe("shadeClass", () => {
  it("puts values in the class of the highest step they reach", () => {
    expect(shadeClass(0, steps)).toBe(0);
    expect(shadeClass(1, steps)).toBe(1);
    expect(shadeClass(4, steps)).toBe(2);
    expect(shadeClass(5, steps)).toBe(3);
    expect(shadeClass(12, steps)).toBe(3);
    expect(shadeClass(28, steps)).toBe(4);
  });

  it("reads numeric strings, as tile properties can be", () => {
    expect(shadeClass("13", steps)).toBe(4);
  });

  it("puts missing and non-numeric values in the lowest class", () => {
    expect(shadeClass(undefined, steps)).toBe(0);
    expect(shadeClass(null, steps)).toBe(0);
    expect(shadeClass("", steps)).toBe(0);
    expect(shadeClass("n/a", steps)).toBe(0);
  });
});

describe("shadeAlphas", () => {
  it("gives one opacity per class, rising with the class", () => {
    const alphas = shadeAlphas(steps);
    expect(alphas).toHaveLength(steps.length + 1);
    for (let i = 1; i < alphas.length; i++) {
      expect(alphas[i]).toBeGreaterThan(alphas[i - 1]);
    }
  });

  it("handles a single step", () => {
    expect(shadeAlphas([1])).toHaveLength(2);
    expect(shadeAlphas([1], true)).toHaveLength(2);
  });

  it("shades even the lowest class by default", () => {
    const [lowest, next] = shadeAlphas(steps);
    expect(lowest).toBe(0.15);
    expect(next).toBeGreaterThan(lowest);
  });

  it("draws the lowest class nearly empty when it means none", () => {
    const alphas = shadeAlphas(steps, true);
    expect(alphas).toHaveLength(steps.length + 1);
    expect(alphas[0]).toBeLessThan(0.15);
    expect(alphas[1]).toBe(0.15);
    expect(alphas.at(-1)).toBe(shadeAlphas(steps).at(-1));
  });
});

describe("withAlpha", () => {
  it("replaces the color's opacity", () => {
    expect(withAlpha("rgba(10, 20, 30, 1)", 0.5)).toBe("rgba(10, 20, 30, 0.5)");
  });

  it("reads hex colors, with or without their own opacity", () => {
    expect(withAlpha("#e93d82", 0.5)).toBe("rgba(233, 61, 130, 0.5)");
    expect(withAlpha("#f8005123", 0.5)).toBe("rgba(248, 0, 81, 0.5)");
  });

  it("leaves colors it can't parse", () => {
    expect(withAlpha("#fff", 0.5)).toBe("#fff");
  });
});

describe("shadeClasses", () => {
  it("gives each class its bounds and the opacity it's drawn at", () => {
    const alphas = shadeAlphas(steps, true);
    expect(shadeClasses({ key: "n", steps, emptyLowest: true })).toEqual([
      { min: undefined, below: 1, alpha: alphas[0] },
      { min: 1, below: 2, alpha: alphas[1] },
      { min: 2, below: 5, alpha: alphas[2] },
      { min: 5, below: 13, alpha: alphas[3] },
      { min: 13, below: undefined, alpha: alphas[4] },
    ]);
  });
});

describe("formatCountRange", () => {
  it("writes each class's whole numbers", () => {
    const shade = { key: "n", steps };
    expect(shadeClasses(shade).map((c) => formatCountRange(c))).toEqual([
      "0",
      "1",
      "2–4",
      "5–12",
      "13+",
    ]);
  });

  it("writes the numbers with the given format", () => {
    const format = (n: number) => n.toLocaleString("en");
    expect(formatCountRange({ min: 1000, alpha: 1 }, format)).toBe("1,000+");
  });
});

describe("formatBoundsRange", () => {
  it("writes each class by its bounds", () => {
    const { format } = new Intl.NumberFormat("en", { notation: "compact" });
    const shade = { key: "n", steps: [10_000, 50_000, 250_000] };
    expect(
      shadeClasses(shade).map((c) => formatBoundsRange(c, format)),
    ).toEqual(["< 10K", "10K–50K", "50K–250K", "250K+"]);
  });
});

describe("hasValue", () => {
  it("accepts numbers and numeric strings", () => {
    expect(hasValue(0)).toBe(true);
    expect(hasValue("12")).toBe(true);
  });

  it("rejects missing and non-numeric values", () => {
    for (const value of [undefined, null, "", "n/a", Number.NaN]) {
      expect(hasValue(value)).toBe(false);
    }
  });
});
