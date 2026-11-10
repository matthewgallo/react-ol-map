import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer, MarkerLayer, type MapColor } from "../src";
import {
  LIBRARY_FILTERS,
  PINS,
  PIN_ANCHORS,
  colorControl,
  selectOf,
} from "./support/controls";
import { renderFields } from "./support/fields";
import { ARIZONA, GEOJSON, POINTS } from "./support/places";
import { StoryMap } from "./support/story-map";

interface MarkerArgs {
  color: MapColor;
  title: string;
  pin: string; // a name in PINS
  pinAnchor: string; // a name in PIN_ANCHORS
  filter: string; // a name in LIBRARY_FILTERS
  visible: boolean;
  interactive: boolean;
  cluster: boolean;
  distance: number;
  minDistance: number;
}

const meta = {
  title: "MarkerLayer",
} satisfies Meta<MarkerArgs>;

export default meta;
type Story = StoryObj<MarkerArgs>;

const libraries = renderFields([
  ["Library", "Name"],
  ["Address", "Address"],
]);

export const Playground: Story = {
  args: {
    color: "blue",
    title: "Libraries",
    pin: "Default",
    pinAnchor: "Unset (tip, or bottom center for a custom pin)",
    filter: "None",
    visible: true,
    interactive: true,
    cluster: true,
    distance: 40,
    minDistance: 0,
  },
  argTypes: {
    color: {
      ...colorControl,
      description: 'A Radix color scale, or "accent" for the theme\'s.',
    },
    title: { description: "Heads the tooltip and details." },
    pin: {
      ...selectOf(PINS),
      description:
        "A component drawn as each pin's image. It gets the theme `colors` and whether it's `hovered`.",
    },
    pinAnchor: {
      ...selectOf(PIN_ANCHORS),
      description:
        "The point of the pin image placed on the coordinate, as fractions of its size.",
    },
    filter: {
      ...selectOf(LIBRARY_FILTERS),
      description:
        "`(props) => boolean`: draws only the features it accepts, here by the city in their address.",
    },
    visible: {
      description:
        "A hidden layer ignores hover and clicks, and closes its details if selected.",
    },
    interactive: {
      description:
        "false makes the layer display-only: no hover, tooltip or click.",
    },
    cluster: {
      table: { category: "cluster" },
      description:
        "Draw nearby points as one badge with their count. GeoJSON only (`url` or `data`), not tiles.",
    },
    distance: {
      control: { type: "range", min: 10, max: 120, step: 5 },
      table: { category: "cluster" },
      description: "Points this many pixels apart cluster.",
      if: { arg: "cluster" },
    },
    minDistance: {
      control: { type: "range", min: 0, max: 100, step: 4 },
      table: { category: "cluster" },
      description: "Keeps badges this many pixels apart.",
      if: { arg: "cluster" },
    },
  },
  parameters: {
    description:
      "MarkerLayer's options, in the Controls panel, on the Arizona libraries (from the sample maps).",
  },
  render: ({ pin, pinAnchor, filter, cluster, distance, minDistance, ...args }) => (
    <StoryMap {...ARIZONA}>
      <AreaLayer
        url={GEOJSON.arizonaBoundary}
        color="gray"
        interactive={false}
      />
      <MarkerLayer
        url={POINTS.arizonaLibraries}
        pin={PINS[pin]}
        pinAnchor={PIN_ANCHORS[pinAnchor]}
        filter={LIBRARY_FILTERS[filter]}
        cluster={cluster && { distance, minDistance }}
        renderTooltip={libraries}
        {...args}
      />
    </StoryMap>
  ),
};
