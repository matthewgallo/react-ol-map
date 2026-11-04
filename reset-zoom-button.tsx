import { IconButton, Tooltip } from "@radix-ui/themes";
import { SizeIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import type OLMap from "ol/Map";
import type { Coordinate } from "ol/coordinate";
import { useZoomChanged } from "./hooks/useZoomChanged";

import styles from "./map.module.css";

const DURATION = 400;

interface ResetZoomButtonProps {
  map: OLMap | null | undefined;
  center: Coordinate; // in the view's projection
  zoom: number;
}

// Shown below the zoom buttons once the map is zoomed away from its default,
// and animates back to the default view (zoom and center) when pressed
export function ResetZoomButton({ map, center, zoom }: ResetZoomButtonProps) {
  const { t } = useTranslation();
  const changed = useZoomChanged(map, zoom);
  if (!map || !changed) return null;

  const reset = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map.getView().animate({ center, zoom, duration: reduceMotion ? 0 : DURATION });
    // The button goes away once reset, so keep focus on the map rather than
    // losing it to the page
    map.getTargetElement()?.focus();
  };

  const label = t("map.resetZoom");
  return (
    <div className={styles.resetZoom}>
      <Tooltip content={label}>
        <IconButton
          size="1"
          variant="surface"
          color="gray"
          highContrast
          aria-label={label}
          onClick={reset}
        >
          <SizeIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
}
