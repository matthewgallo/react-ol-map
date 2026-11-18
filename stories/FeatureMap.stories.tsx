import type { Meta, StoryObj } from "@storybook/react-vite";
import StadiaMaps from "ol/source/StadiaMaps";
import {
  AreaLayer,
  MarkerLayer,
  cartoBasemap,
  esriGrayBasemap,
  osmBasemap,
  stadiaBasemap,
  type Appearance,
  type BasemapOption,
} from "../src";
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

const OSM_CONTRIBUTORS =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_TILES = 'Tiles © <a href="https://www.esri.com">Esri</a>';
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

// The presets, then other free tiles that need no key (Stadia's only on
// localhost or an allowed domain). Most have a single style for light and
// dark. Defined once, outside render: a new `source` function each render
// would make a new source each time.
const BASEMAPS: Record<string, BasemapOption> = {
  "CARTO (cartoBasemap)": cartoBasemap(import.meta.env.VITE_MAP_KEY),
  "OpenStreetMap (osmBasemap)": osmBasemap(),
  "Stadia Alidade Smooth (stadiaBasemap)": stadiaBasemap(),
  "Esri Gray Canvas (esriGrayBasemap)": esriGrayBasemap(),
  "Esri World Imagery": {
    url: () => `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attributions: `${ESRI_TILES} — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community`,
    maxZoom: 19,
  },
  "Esri World Topo": {
    url: () => `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    attributions: `${ESRI_TILES} — Esri, HERE, Garmin, USGS, ${OSM_CONTRIBUTORS}`,
    maxZoom: 19,
  },
  // Public domain, United States only
  "USGS Topo": {
    url: () =>
      "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    attributions:
      'Tiles courtesy of the <a href="https://www.usgs.gov/">U.S. Geological Survey</a>',
    maxZoom: 16,
  },
  OpenTopoMap: {
    url: () => "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attributions: `${OSM_CONTRIBUTORS}, SRTM | Style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)`,
    maxZoom: 17,
  },
  "Humanitarian OSM": {
    url: () => "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attributions: `${OSM_CONTRIBUTORS}, style by <a href="https://www.hotosm.org/">Humanitarian OpenStreetMap Team</a>, hosted by <a href="https://openstreetmap.fr/">OpenStreetMap France</a>`,
    maxZoom: 19,
  },
  CyclOSM: {
    url: () =>
      "https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attributions: `<a href="https://www.cyclosm.org">CyclOSM</a> | ${OSM_CONTRIBUTORS}`,
    maxZoom: 20,
  },
  // Custom OpenLayers sources, through `source`
  "Stamen Toner (custom source)": {
    source: (dark) =>
      new StadiaMaps({ layer: dark ? "stamen_toner_dark" : "stamen_toner" }),
  },
  "Stamen Terrain (custom source)": {
    source: () => new StadiaMaps({ layer: "stamen_terrain" }),
  },
  "Stamen Watercolor (custom source)": {
    source: () => new StadiaMaps({ layer: "stamen_watercolor" }),
  },
};

export const Basemaps: StoryObj<{ basemap: string }> = {
  args: { basemap: "CARTO (cartoBasemap)" },
  argTypes: {
    basemap: {
      ...selectOf(BASEMAPS),
      description:
        "The tiles beneath the layers. Switch the theme to see the dark style of those that have one (CARTO, Stadia Alidade Smooth, Esri Gray Canvas, Stamen Toner).",
    },
  },
  parameters: {
    controls: { disable: false },
    description:
      "Each basemap preset, other free tiles as `{ url, attributions, maxZoom }`, and custom OpenLayers sources (`{ source: (dark) => TileSource }`). Switching keeps the view, and the attribution follows the provider. Stadia's tiles load only on localhost or a domain allowed in Stadia.",
  },
  render: ({ basemap }) => (
    <StoryMap
      center={[-110.926, 32.2217]}
      zoom={11}
      basemap={BASEMAPS[basemap]}
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
