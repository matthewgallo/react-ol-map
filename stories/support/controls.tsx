import {
  DefaultPin,
  type FeatureFilter,
  type MapColor,
  type PinComponent,
  type PinProps,
} from "../../src";
import { PapelPicadoPin } from "./papel-picado-pin";
import {
  CONTIGUOUS_US_BOUNDS,
  PIMA_COUNTY_BOUNDS,
  TUCSON_CITY_BOUNDS,
} from "./places";

// Options for the Controls panel. Values that aren't plain text, numbers or
// booleans (coordinates, components, functions) are picked by name: the arg
// holds the name, and the story looks its value up when rendering.

// Every Radix Themes color a layer can take. Preview loads all their scales.
export const COLORS = [
  "accent",
  "gray",
  "gold",
  "bronze",
  "brown",
  "yellow",
  "amber",
  "orange",
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "mint",
  "sky",
] as const satisfies readonly MapColor[];

export const colorControl = {
  options: COLORS,
  control: { type: "select" },
} as const;

// A select control of the names of `values`
export const selectOf = (values: Record<string, unknown>) => ({
  options: Object.keys(values),
  control: { type: "select" } as const,
});

export const CENTERS: Record<string, [number, number] | undefined> = {
  "Unset (bounds or default)": undefined,
  "Tucson landmarks": [-110.975, 32.19],
  Tucson: [-110.926, 32.2217],
  Arizona: [-111.7, 34.2],
};

export const BOUNDS: Record<string, [number, number, number, number] | undefined> = {
  "Unset (center and zoom)": undefined,
  "Tucson city": TUCSON_CITY_BOUNDS,
  "Pima County": PIMA_COUNTY_BOUNDS,
  "Contiguous US": CONTIGUOUS_US_BOUNDS,
};

// A dot instead of a teardrop, as in the README. Defined outside render, as
// pins must be.
function DotPin({ hovered, colors }: PinProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={hovered ? colors.hoverStroke : colors.stroke}
        stroke={colors.outline}
        strokeWidth="1.5"
      />
    </svg>
  );
}

// The default pin in a fixed color, whatever the layer's
const RedPin = (props: PinProps) => <DefaultPin {...props} color="#e5484d" />;

export const PINS: Record<string, PinComponent | undefined> = {
  Default: undefined,
  "Default, fixed red": RedPin,
  Dot: DotPin,
  "Papel picado": PapelPicadoPin,
};

export const PIN_ANCHORS: Record<string, [number, number] | undefined> = {
  "Unset (tip, or bottom center for a custom pin)": undefined,
  "Center [0.5, 0.5]": [0.5, 0.5],
  "Bottom center [0.5, 1]": [0.5, 1],
};

// Filters for the Arizona libraries, by the city in their address. Defined
// once, as a new filter function restyles the layer.
const inCity =
  (city: string): FeatureFilter =>
  (props) =>
    String(props.Address ?? "").includes(`, ${city},`);

export const LIBRARY_FILTERS: Record<string, FeatureFilter | undefined> = {
  None: undefined,
  "In Tucson": inCity("Tucson"),
  "In Phoenix": inCity("Phoenix"),
};
