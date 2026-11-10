import { useContext, useId, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";
import { useLabels } from "./labels";
import { useIsTouchScreen } from "./hooks/useIsTouchScreen";
import { FeatureMapContext, useFeatureMap } from "./context";
import type { MapColor } from "./types";
import { hatchBackground } from "./utils/hatch";
import {
  formatBoundsRange,
  formatCountRange,
  hasValue,
  shadeClass,
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
  // Index of the item to emphasize, such as the hovered feature's, with the
  // rest dimmed
  active?: number;
}

// An ordered scale: a bar of swatches, each labeled beneath. Screen readers
// get the title and the labels in order; the swatches are decorative.
export function LegendScale({
  title,
  items,
  outline,
  active,
}: LegendScaleProps) {
  const titleId = useId();
  return (
    <figure className={styles.legendScale} aria-labelledby={titleId}>
      <Text as="div" size="1" weight="medium" asChild>
        <figcaption id={titleId}>{title}</figcaption>
      </Text>
      <ol
        className={styles.legendItems}
        data-has-active={active != null || undefined}
        // The scale's swatches share its width evenly; one set apart takes
        // its label's
        style={{
          gridTemplateColumns: items
            .map(({ apart }) => (apart ? "auto" : "1fr"))
            .join(" "),
        }}
      >
        {items.map(({ label, fill, apart }, i) => (
          <li
            key={label}
            data-apart={apart || undefined}
            data-active={i === active || undefined}
            aria-current={i === active || undefined}
          >
            <span
              className={styles.legendSwatch}
              style={{
                background: fill,
                borderColor: outline && `var(--${outline}-9)`,
              }}
              aria-hidden
            />
            {/* data-label sizes it for its bold, emphasized text, so
                emphasizing an item doesn't resize the legend */}
            <Text
              size="1"
              color="gray"
              className={styles.legendLabel}
              data-label={label}
            >
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
  // The shaded layer's `id`. Emphasizes the class of its hovered feature, or
  // else of its selected one while its details are open, which tells apart
  // shades that look alike.
  layerId?: string;
}

export type RangeStyle = "count" | "compact";

// The scale of an AreaLayer's `shade`, with the same classes and opacities
export function ShadeLegend({
  title,
  shade,
  color = "accent",
  ranges = "count",
  formatRange,
  layerId,
}: ShadeLegendProps) {
  const { labels, locale: language } = useLabels();
  // Nullable rather than useFeatureMap, so the legend renders outside a map
  const map = useContext(FeatureMapContext);
  const hit =
    map?.hovered ?? (map?.detailsOpen ? map.selected : undefined);
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
  let active: number | undefined;
  if (layerId != null && hit?.layerId === layerId) {
    const value = hit.feature.get(shade.key);
    active =
      shade.noData && !hasValue(value)
        ? items.length - 1 // no data, last
        : shadeClass(value, shade.steps);
  }
  return (
    <LegendScale
      title={title}
      items={items}
      outline={color}
      active={active}
    />
  );
}
