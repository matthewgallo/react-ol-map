import { Callout, Skeleton } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { GeoJsonMap, type BaseProps } from ".";
import { useGeoJson } from "../../hooks/useGeoJson";

import styles from "./geojson-map.module.css";

interface AsyncGeoJsonMapProps extends BaseProps {
  url: string;
}

// Fetches GeoJSON from `url` and renders a map, with loading/error states
export function AsyncGeoJsonMap({ url, ...props }: AsyncGeoJsonMapProps) {
  const { data, error } = useGeoJson(url);

  if (error) {
    return (
      <Callout.Root color="red" m="4">
        <Callout.Icon>
          <ExclamationTriangleIcon />
        </Callout.Icon>
        <Callout.Text>Couldn't load map data.</Callout.Text>
      </Callout.Root>
    );
  }

  if (!data) {
    return (
      <Skeleton
        className={`${styles.mapContainer} ${props.className || ""}`.trim()}
        style={props.height ? { height: props.height } : undefined}
      />
    );
  }

  return <GeoJsonMap data={data} {...props} />;
}
