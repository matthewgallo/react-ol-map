import { Callout, Skeleton } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { FeatureMap, type BaseProps, type MarkerLayer } from ".";
import type { TileConfig } from "./hooks/useVectorTileLayer";
import { useGeoJson } from "../../hooks/useGeoJson";

import styles from "./map.module.css";

type AsyncFeatureMapProps = Omit<BaseProps, "markers"> & {
  markers?: Omit<MarkerLayer, "data"> & { url: string };
} & ({ url: string; tiles?: never } | { tiles: TileConfig; url?: never });

// Fetches GeoJSON from `url` (and `markers.url`, if given) and renders a map,
// with loading/error states. Tiles stream themselves, so they aren't fetched.
export function AsyncFeatureMap({
  url,
  tiles,
  markers,
  ...props
}: AsyncFeatureMapProps) {
  const { t } = useTranslation();
  const shapes = useGeoJson(url);
  const pins = useGeoJson(markers?.url);

  if (shapes.error || pins.error) {
    return (
      <Callout.Root color="red" m="4">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>{t("map.loadError")}</Callout.Text>
      </Callout.Root>
    );
  }

  if ((url && !shapes.data) || (markers && !pins.data)) {
    return (
      <Skeleton
        className={`${styles.mapContainer} ${props.className || ""}`.trim()}
        style={props.height ? { height: props.height } : undefined}
      />
    );
  }

  const markerLayer =
    markers && pins.data ? { ...markers, data: pins.data } : undefined;

  return tiles ? (
    <FeatureMap tiles={tiles} markers={markerLayer} {...props} />
  ) : (
    shapes.data && (
      <FeatureMap data={shapes.data} markers={markerLayer} {...props} />
    )
  );
}
