import { useId, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";
import { useLabels } from "./labels";
import { useIsTouchScreen } from "./hooks/useIsTouchScreen";
import { useFeatureMap } from "./context";
import type { MapColor } from "./types";
import { hatchBackground } from "./utils/hatch";
import {
  formatBoundsRange,
  formatCountRange,
  shadeClasses,
  type Shade,
  type ShadeClass,
} from "./utils/shade";

import styles from "./map.module.css";

// The key to a map's colors, over its top end corner, below the full screen
// button. A child of FeatureMap, so it stays in view in full screen. Holds
// one or more scales, such as a LegendScale or ShadeLegend for each layer
// that needs one; renders nothing without them.
//
// Compact on touch screens while the details sheet is open, which leaves
// little of the map in view. It stays, as layers drawn only while their
// parent's details are open, such as a county's divisions, need it then.
export function MapLegend({ children }: { children?: ReactNode }) {
  const { labels } = useLabels();
  const { detailsOpen } = useFeatureMap();
  const isTouch = useIsTouchScreen();
  if (!children || (Array.isArray(children) && !children.some(Boolean))) {
    return null;
  }
  return (
    <section
      className={styles.legend}
      data-compact={(isTouch && detailsOpen) || undefined}
      aria-label={labels.legend}
    >
      {children}
    </section>
  );
}

export interface LegendItem {
  label: string;
  // Any CSS background: a color, such as a Radix token, or a pattern
  fill: string;
  // Set apart from the items before it, for one outside the scale, such as
  // no data
  apart?: boolean;
}

interface LegendScaleProps {
  title: string;
  items: LegendItem[]; // in order, lowest first
  // Outlines the swatches in this color's border step, as its areas are
  // outlined on the map, so faint swatches still show
  outline?: MapColor;
}

// An ordered scale: a bar of swatches, each labeled beneath. Screen readers
// get the title and the labels in order; the swatches are decorative.
export function LegendScale({ title, items, outline }: LegendScaleProps) {
  const titleId = useId();
  return (
    <figure className={styles.legendScale} aria-labelledby={titleId}>
      <Text as="div" size="1" weight="medium" asChild>
        <figcaption id={titleId}>{title}</figcaption>
      </Text>
      <ol
        className={styles.legendItems}
        // The scale's swatches share its width evenly; one set apart takes
        // its label's
        style={{
          gridTemplateColumns: items
            .map(({ apart }) => (apart ? "auto" : "1fr"))
            .join(" "),
        }}
      >
        {items.map(({ label, fill, apart }) => (
          <li key={label} data-apart={apart || undefined}>
            <span
              className={styles.legendSwatch}
              style={{
                background: fill,
                borderColor: outline && `var(--${outline}-9)`,
              }}
              aria-hidden
            />
            <Text size="1" color="gray">
              {label}
            </Text>
          </li>
        ))}
      </ol>
    </figure>
  );
}

interface ShadeLegendProps {
  title: string;
  shade: Shade;
  color?: MapColor; // the shaded layer's
  // How each class is labeled, with numbers in the page's language:
  // - "count": whole numbers, "0", "2–4" or "13+" (the default)
  // - "compact": by their bounds, abbreviated, "< 10K", "10K–50K" or "250K+",
  //   for large values
  ranges?: RangeStyle;
  // Labels each class in place of `ranges`
  formatRange?: (shadeClass: ShadeClass) => string;
}

export type RangeStyle = "count" | "compact";

// The scale of an AreaLayer's `shade`, with the same classes and opacities
export function ShadeLegend({
  title,
  shade,
  color = "accent",
  ranges = "count",
  formatRange,
}: ShadeLegendProps) {
  const { labels, locale: language } = useLabels();
  const label =
    formatRange ??
    (ranges === "compact"
      ? (shadeClass: ShadeClass) => {
          const { format } = new Intl.NumberFormat(language, {
            notation: "compact",
          });
          return formatBoundsRange(shadeClass, format);
        }
      : (shadeClass: ShadeClass) =>
          formatCountRange(shadeClass, (n) => n.toLocaleString(language)));
  // As useAreaStyles draws them: the layer's border color at each class's
  // opacity, and hatched in it for no data
  const items: LegendItem[] = shadeClasses(shade).map((shadeClass) => ({
    label: label(shadeClass),
    fill: `color-mix(in srgb, var(--${color}-9) ${shadeClass.alpha * 100}%, transparent)`,
  }));
  if (shade.noData) {
    items.push({
      label: labels.noData,
      fill: hatchBackground(`var(--${color}-9)`),
      apart: true,
    });
  }
  return <LegendScale title={title} items={items} outline={color} />;
}
