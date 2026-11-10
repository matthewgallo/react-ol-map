import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer } from "../src";
import { renderFields } from "./support/fields";
import { GEOJSON, PIMA_COUNTY_BOUNDS, TUCSON, tiles } from "./support/places";
import { StoryMap } from "./support/story-map";

// AreaLayer: polygons filled in a Radix color, over display-only boundaries,
// as folklorico's sample maps draw them
const meta = {
  title: "Areas",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const CityLimits = () => (
  <AreaLayer
    url={GEOJSON.tucsonCityLimits}
    color="gray"
    interactive={false}
    zIndex={0}
  />
);

// Display-only county outline, from the population tiles' shape
const County = () => (
  <AreaLayer
    {...tiles("pima_county_population")}
    color="gray"
    interactive={false}
    zIndex={0}
  />
);

const neighborhood = renderFields([["NAME", "Neighborhood"]]);
const subdivision = renderFields([["SUB_NAME", "Subdivision"]]);
const protectedLand = renderFields([
  ["ONAME1", "Property"],
  ["OWNER", "Owner"],
  ["DEPT", "Department"],
]);

export const TucsonNeighborhoods: Story = {
  name: "Tucson neighborhoods",
  parameters: {
    description:
      "Sample maps › Tucson neighborhoods: tile areas over the display-only GeoJSON city limits.",
  },
  render: () => (
    <StoryMap {...TUCSON}>
      <CityLimits />
      <AreaLayer
        {...tiles("tucson_neighborhoods")}
        color="violet"
        title="Neighborhoods"
        renderTooltip={neighborhood}
        zIndex={1}
      />
    </StoryMap>
  ),
};

export const Subdivisions: Story = {
  parameters: {
    description:
      "Sample maps › Subdivisions: thousands of small tile areas, loaded only for what's in view.",
  },
  render: () => (
    <StoryMap {...TUCSON}>
      <CityLimits />
      <AreaLayer
        {...tiles("pima_subdivisions")}
        color="blue"
        title="Subdivisions"
        renderTooltip={subdivision}
        zIndex={1}
      />
    </StoryMap>
  ),
};

export const ProtectedLands: Story = {
  name: "Protected lands",
  parameters: {
    description:
      "Sample maps › Protected lands: tile areas over a display-only county outline.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <County />
      <AreaLayer
        {...tiles("protected-lands-pima-county")}
        color="grass"
        title="Protected lands"
        renderTooltip={protectedLand}
        zIndex={1}
      />
    </StoryMap>
  ),
};

// Several area layers overlaid, each with its own color, tooltip and details.
// zIndex keeps them in order, as same-zIndex layers draw in the order added.
export const LandUse: Story = {
  name: "Land use",
  parameters: {
    description:
      "Sample maps › Land use: two tile area layers stacked with `zIndex` over a display-only county. Hover where they overlap: the top-most feature wins.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <County />
      <AreaLayer
        {...tiles("protected-lands-pima-county")}
        color="grass"
        title="Protected lands"
        renderTooltip={protectedLand}
        zIndex={1}
      />
      <AreaLayer
        {...tiles("pima_subdivisions")}
        color="blue"
        title="Subdivisions"
        renderTooltip={subdivision}
        zIndex={2}
      />
    </StoryMap>
  ),
};
