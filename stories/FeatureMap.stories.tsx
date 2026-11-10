import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer, MarkerLayer, type Appearance } from "../src";
import { BOUNDS, CENTERS, selectOf } from "./support/controls";
import { renderFields } from "./support/fields";
import { GEOJSON, PIMA_COUNTY_BOUNDS, TUCSON, tiles } from "./support/places";
import { StoryMap } from "./support/story-map";

// FeatureMap's own options. Use the toolbar to switch the theme, which the
// basemap and layer colors follow, and the language of the map's own text.

interface PlaygroundArgs {
  center: string; // a name in CENTERS
  zoom: number;
  bounds: string; // a name in BOUNDS
  height: number; // 0 leaves it unset
  appearance: "Follow the page" | Appearance;
  highlightOnHover: boolean;
  fullScreen: boolean;
  resetView: boolean;
}

const meta = {
  title: "FeatureMap",
  parameters: { controls: { disable: true } },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

const neighborhoods = renderFields([["NAME", "Neighborhood"]]);
const landmarks = renderFields([
  ["name", "Name"],
  ["established", "Established"],
]);

export const Playground: Story = {
  args: {
    center: "Tucson landmarks",
    zoom: 12,
    bounds: "Unset (center and zoom)",
    height: 0,
    appearance: "Follow the page",
    highlightOnHover: true,
    fullScreen: true,
    resetView: true,
  },
  argTypes: {
    center: {
      ...selectOf(CENTERS),
      description:
        "Initial center, [longitude, latitude]. Changing it remounts the map.",
    },
    zoom: {
      control: { type: "range", min: 3, max: 18, step: 1 },
      description: "Initial zoom. Changing it remounts the map.",
    },
    bounds: {
      ...selectOf(BOUNDS),
      description:
        "[west, south, east, north], fitted to the map in place of center and zoom, however big the map is. Changing it remounts the map.",
    },
    height: {
      control: { type: "range", min: 0, max: 800, step: 20 },
      description:
        "Fixed height in pixels. 0 leaves it unset: square, up to 600px tall.",
    },
    appearance: {
      options: ["Follow the page", "light", "dark"],
      control: { type: "inline-radio" },
      description:
        "Light or dark basemap. Unset, it follows the page (the Theme toolbar).",
    },
    highlightOnHover: {
      description: "Highlight the feature under the pointer, with a mouse.",
    },
    fullScreen: { description: "Show the full screen button." },
    resetView: {
      description: "Show a reset button once moved away from the initial view.",
    },
  },
  parameters: {
    controls: { disable: false },
    description:
      "Every FeatureMap option, in the Controls panel, over the Tucson landmarks map's layers. Hover a feature for its tooltip, click it for its details, and pan away for the reset button.",
  },
  render: ({ center, zoom, bounds, height, appearance, ...args }) => (
    <StoryMap
      // Remounts for a new initial view
      key={`${center}|${zoom}|${bounds}`}
      center={CENTERS[center]}
      zoom={zoom}
      bounds={BOUNDS[bounds]}
      height={height || undefined}
      appearance={appearance === "Follow the page" ? undefined : appearance}
      {...args}
    >
      <AreaLayer
        {...tiles("tucson_neighborhoods")}
        color="violet"
        title="Neighborhoods"
        renderTooltip={neighborhoods}
        zIndex={0}
      />
      <MarkerLayer
        url={GEOJSON.tucsonLandmarks}
        color="cyan"
        title="Landmarks"
        renderTooltip={landmarks}
      />
    </StoryMap>
  ),
};

// `bounds` fits an area to the map, whatever its size, in place of center and
// zoom. Most of folklorico's maps open this way.
export const FitToBounds: Story = {
  parameters: {
    description:
      "Fitted to Pima County with `bounds`, as the Pima County maps open. The county is a display-only layer (`interactive={false}`).",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <AreaLayer
        {...tiles("pima_county_population")}
        color="gray"
        interactive={false}
      />
    </StoryMap>
  ),
};

export const WithoutControls: Story = {
  parameters: {
    description: "`fullScreen={false}` and `resetView={false}`.",
  },
  render: () => (
    <StoryMap {...TUCSON} fullScreen={false} resetView={false}>
      <AreaLayer
        url={GEOJSON.tucsonCityLimits}
        color="gray"
        interactive={false}
      />
    </StoryMap>
  ),
};

export const LoadError: Story = {
  parameters: {
    description:
      "A layer whose `url` fails to load shows the map's load error message (translated with the Language toolbar).",
  },
  render: () => (
    <StoryMap {...TUCSON}>
      <AreaLayer url="/data/geojson/missing.json" color="red" />
    </StoryMap>
  ),
};
