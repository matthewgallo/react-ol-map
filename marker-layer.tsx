import { InteractiveLayer } from "./interactive-layer";
import { usePinStyles } from "./hooks/useLayerStyles";
import { useGeoJsonLayer } from "./hooks/useGeoJsonLayer";
import { useLayerData } from "./hooks/useLayerData";
import type { PinComponent } from "./pin";
import type { GeoJsonData, LayerProps } from "./types";

// Markers draw above area layers and their highlights by default
const MARKERS_Z_INDEX = 20;

export type MarkerLayerProps = LayerProps &
  ({ data: GeoJsonData; url?: never } | { url: string; data?: never }) & {
    pin?: PinComponent; // defaults to DefaultPin; define it outside render
    pinAnchor?: [number, number]; // point of the pin on the feature; defaults to bottom center
  };

// Point features drawn as pins, which take priority over the shapes beneath
export function MarkerLayer({
  data,
  url,
  pin,
  pinAnchor,
  color,
  zIndex = MARKERS_Z_INDEX,
  ...props
}: MarkerLayerProps) {
  const styles = usePinStyles(pin, pinAnchor, color);
  const layer = useGeoJsonLayer(useLayerData(data, url), styles.base);
  return (
    <InteractiveLayer
      layer={layer}
      hoverStyle={styles.hover}
      zIndex={zIndex}
      color={color}
      {...props}
    />
  );
}
