import { describe, expect, it } from "vitest";
import type { ThemeColors } from "../hooks/useThemeColors";
import { DefaultPin, type PinProps } from "../pin";
import { pinToSrc } from "./pinToSrc";

const colors: ThemeColors = {
  fill: "rgba(0, 0, 0, 0.2)",
  stroke: "#111111",
  hoverFill: "rgba(0, 0, 0, 0.4)",
  hoverStroke: "#222222",
  outline: "#ffffff",
};

const decode = (src: string) =>
  decodeURIComponent(src.replace("data:image/svg+xml;charset=utf-8,", ""));

describe("pinToSrc", () => {
  it("renders the pin as an SVG data URL with a namespace", () => {
    const svg = decode(pinToSrc(DefaultPin, { hovered: false, colors }));
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(svg).toContain('fill="#111111"');
  });

  it("uses the hover color when hovered", () => {
    const svg = decode(pinToSrc(DefaultPin, { hovered: true, colors }));
    expect(svg).toContain('fill="#222222"');
  });

  it("renders custom pin components", () => {
    const RedPin = (props: PinProps) => (
      <DefaultPin {...props} color="#ff0000" />
    );
    const svg = decode(pinToSrc(RedPin, { hovered: true, colors }));
    expect(svg).toContain('fill="#ff0000"');
  });
});
