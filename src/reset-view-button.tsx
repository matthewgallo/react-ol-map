import { IconButton, Tooltip } from "@radix-ui/themes";
import { Crosshair2Icon } from "@radix-ui/react-icons";
import { useLabels } from "./labels";
import type OLMap from "ol/Map";
import type { Coordinate } from "ol/coordinate";
import { useViewChanged } from "./hooks/useViewChanged";
import { VIEW_ANIMATION_DURATION, easeOutCubic } from "./animation";

import styles from "./map.module.css";

interface ResetViewButtonProps {
  map: OLMap | null | undefined;
  center: Coordinate; // in the view's projection
  zoom: number;
}

// Shown below the zoom buttons once the map is zoomed or panned away from its
// default view, and animates back to it (center and zoom) when pressed
export function ResetViewButton({ map, center, zoom }: ResetViewButtonProps) {
  const { labels } = useLabels();
  const changed = useViewChanged(map, center, zoom);
  if (!map || !changed) return null;

  const reset = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map.getView().animate({
      center,
      zoom,
      duration: reduceMotion ? 0 : VIEW_ANIMATION_DURATION,
      easing: easeOutCubic,
    });
    // The button goes away once reset, so keep focus on the map rather than
    // losing it to the page
    map.getTargetElement()?.focus();
  };

  const label = labels.resetView;
  return (
    <div className={styles.resetView}>
      <Tooltip content={label}>
        <IconButton
          size="1"
          variant="surface"
          color="gray"
          highContrast
          aria-label={label}
          onClick={reset}
        >
          <Crosshair2Icon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
