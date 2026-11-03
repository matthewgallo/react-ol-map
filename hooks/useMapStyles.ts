import { useMemo } from "react";
import { Circle, Fill, Icon, Stroke, Style } from "ol/style";
import { useThemeColors } from "./useThemeColors";
import { DefaultPin, pinToSrc, type PinComponent } from "../pin";

const HOVER_SCALE = 1.25;

// Feature styles that follow the Radix accent color and light/dark appearance
// `pinAnchor` is the fraction of the pin image placed on the point
export const useMapStyles = (
  Pin: PinComponent = DefaultPin,
  pinAnchor: [number, number] = [0.5, 1],
) => {
  const colors = useThemeColors();
  const [anchorX, anchorY] = pinAnchor;

  const pinStyles = useMemo(() => {
    const icon = (hovered: boolean) =>
      new Icon({
        src: pinToSrc(Pin, { hovered, colors }),
        anchor: [anchorX, anchorY],
        scale: hovered ? HOVER_SCALE : 1,
      });
    return {
      pin: new Style({ image: icon(false) }),
      pinHover: new Style({ image: icon(true), zIndex: 1 }),
    };
  }, [colors, Pin, anchorX, anchorY]);

  const featureStyles = useMemo(
    () => ({
      base: new Style({
        fill: new Fill({ color: colors.fill }),
        stroke: new Stroke({ color: colors.stroke, width: 1.25 }),
        image: new Circle({
          radius: 5,
          fill: new Fill({ color: colors.stroke }),
          stroke: new Stroke({ color: colors.outline, width: 1.5 }),
        }),
      }),
      hover: new Style({
        fill: new Fill({ color: colors.hoverFill }),
        stroke: new Stroke({ color: colors.hoverStroke, width: 3 }),
        image: new Circle({
          radius: 7,
          fill: new Fill({ color: colors.hoverStroke }),
          stroke: new Stroke({ color: colors.outline, width: 2 }),
        }),
        zIndex: 1,
      }),
    }),
    [colors],
  );

  return useMemo(
    () => ({ ...featureStyles, ...pinStyles }),
    [featureStyles, pinStyles],
  );
};
