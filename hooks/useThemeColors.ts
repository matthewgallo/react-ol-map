import { useMemo, useSyncExternalStore } from "react";
import type { MapColor } from "../types";

// Radix Themes steps used to style map features, read from the chosen color
// scale (e.g. --accent-9, --blue-9)
const STEPS = {
  fill: "a4",
  nestedFill: "a5",
  stroke: "9",
  hoverFill: "a6",
  hoverStroke: "11",
} as const;
const OUTLINE = "--color-panel-solid";

const tokensFor = (color: MapColor) => [
  ...Object.values(STEPS).map((step) => `--${color}-${step}`),
  OUTLINE,
];

export type ThemeColors = Record<keyof typeof STEPS | "outline", string>;

// Used until the Theme root is in the DOM, or for an unknown color (tomato,
// light)
const FALLBACK: ThemeColors = {
  fill: "rgba(229, 77, 46, 0.2)",
  nestedFill: "rgba(229, 77, 46, 0.3)",
  stroke: "#e54d2e",
  hoverFill: "rgba(229, 77, 46, 0.4)",
  hoverStroke: "#d13415",
  outline: "#ffffff",
};

const subscribe = (onChange: () => void) => {
  // next-themes switches light/dark via the class on <html>
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  return () => observer.disconnect();
};

// Raw token values joined into a string so the snapshot is stable between reads
const getSnapshot = (color: MapColor) => {
  const el =
    document.querySelector(".radix-themes") ?? document.documentElement;
  const style = getComputedStyle(el);
  return tokensFor(color)
    .map((token) => style.getPropertyValue(token).trim())
    .join("|");
};

let ctx: CanvasRenderingContext2D | null = null;

// Radix uses display-p3 colors where supported, but OpenLayers only parses
// sRGB, so paint the color to a canvas and read it back as rgba()
const toRgba = (color: string) => {
  ctx ??= document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (!ctx) return undefined;

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "transparent"; // invalid colors are ignored, so reset first
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
};

// Colors from a Radix scale ("accent" by default), as sRGB for OpenLayers
export const useThemeColors = (color: MapColor = "accent"): ThemeColors => {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => getSnapshot(color),
    () => "",
  );

  return useMemo(() => {
    const values = snapshot.split("|");
    const keys = [...Object.keys(STEPS), "outline"] as (keyof ThemeColors)[];
    return Object.fromEntries(
      keys.map((key, i) => [
        key,
        (values[i] && toRgba(values[i])) || FALLBACK[key],
      ]),
    ) as ThemeColors;
  }, [snapshot]);
};
