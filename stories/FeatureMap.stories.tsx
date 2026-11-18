import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer, MarkerLayer, type Appearance } from "../src";
import { BASEMAP_EXAMPLES, basemapSnippet } from "./support/basemaps";
import { BOUNDS, CENTERS, selectOf } from "./support/controls";
import { renderFields } from "./support/fields";
import { GEOJSON, tiles } from "./support/places";
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
      "Fitted to Pima County with `bounds`, as the protected lands and land use sample maps open. The county is a display-only layer (`interactive={false}`).",
  },
  render: () => (
    <StoryMap bounds={[-113.3339, 31.4261, -110.4477, 32.5142]}>
      <AreaLayer
        tiles={{ url: "data/tiles/pima_county.pmtiles" }}
        color="gray"
        interactive={false}
      />
    </StoryMap>
  ),
};

export const Basemaps: StoryObj<{ basemap: string }> = {
  args: { basemap: "CARTO (cartoBasemap)" },
  argTypes: {
    basemap: {
      ...selectOf(BASEMAP_EXAMPLES),
      description:
        "The tiles beneath the layers. Switch the theme to see the dark style of those that have one (CARTO, Stadia Alidade Smooth, Esri Gray Canvas, Stamen Toner).",
    },
  },
  parameters: {
    controls: { disable: false },
    // The code for the chosen basemap, under the map and in the Code panel
    snippet: basemapSnippet,
    description:
      "Each basemap preset, other free tiles as `{ url, attributions, maxZoom }`, and custom OpenLayers sources (`{ source: (dark) => TileSource }`). Switching keeps the view, and the attribution follows the provider. Stadia's tiles load only on localhost or a domain allowed in Stadia.",
  },
  render: ({ basemap }) => (
    <StoryMap
      center={[-110.926, 32.2217]}
      zoom={11}
      basemap={BASEMAP_EXAMPLES[basemap].basemap}
    >
      <AreaLayer
        url="data/geojson/tucson_city_limits.json"
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
    <StoryMap
      center={[-110.926, 32.2217]}
      zoom={10}
      fullScreen={false}
      resetView={false}
    >
      <AreaLayer
        url="data/geojson/tucson_city_limits.json"
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
    <StoryMap center={[-110.926, 32.2217]} zoom={10}>
      <AreaLayer url="data/geojson/missing.json" color="red" />
    </StoryMap>
  ),
};
