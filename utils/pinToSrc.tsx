import { renderToStaticMarkup } from "react-dom/server";
import type { PinComponent, PinProps } from "../pin";

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

// Data URL of the pin's markup, for an OpenLayers Icon
export const pinToSrc = (Pin: PinComponent, props: PinProps) => {
  const markup = renderToStaticMarkup(<Pin {...props} />);
  const svg = markup.includes(SVG_NS)
    ? markup
    : markup.replace("<svg", `<svg ${SVG_NS}`); // required in an image
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
