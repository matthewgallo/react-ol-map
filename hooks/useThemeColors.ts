import { useMemo, useSyncExternalStore } from "react";

// Radix Themes tokens used to style map features
const TOKENS = {
  fill: "--accent-a4",
  stroke: "--accent-9",
  hoverFill: "--accent-a6",
  hoverStroke: "--accent-11",
  outline: "--color-panel-solid",
} as const;

export type ThemeColors = Record<keyof typeof TOKENS, string>;

// Used until the Theme root is in the DOM (tomato, light)
const FALLBACK: ThemeColors = {
  fill: "rgba(229, 77, 46, 0.2)",
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
const getSnapshot = () => {
  const el =
    document.querySelector(".radix-themes") ?? document.documentElement;
  const style = getComputedStyle(el);
  return Object.values(TOKENS)
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

export const useThemeColors = (): ThemeColors => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");

  return useMemo(() => {
    const values = snapshot.split("|");
    const keys = Object.keys(TOKENS) as (keyof ThemeColors)[];
    return Object.fromEntries(
      keys.map((key, i) => [
        key,
        (values[i] && toRgba(values[i])) || FALLBACK[key],
      ]),
    ) as ThemeColors;
  }, [snapshot]);
};
