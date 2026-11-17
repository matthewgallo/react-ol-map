import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataList, Text } from "@radix-ui/themes";
import { AreaLayer } from "../src";
import { StoryMap } from "./support/story-map";

// AreaLayer: polygons filled in a Radix color, over display-only boundaries,
// as folklorico's sample maps draw them. Each story's render is written as a
// consumer would write it (literal URLs, views and tooltips, no story
// helpers), since it's shown as the story's code (see .storybook/source.ts).
const meta = {
  title: "Areas",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdjoiningAreas: Story = {
  name: "Adjoining areas",
  parameters: {
    sampleMap: "Tucson neighborhoods",
    description: "Tile areas over the display-only GeoJSON city limits.",
  },
  render: () => (
    <StoryMap center={[-110.926, 32.2217]} zoom={10}>
      <AreaLayer
        url="data/geojson/tucson_city_limits.json"
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        tiles={{ url: "data/tiles/tucson_neighborhoods.pmtiles" }}
        color="violet"
        title="Neighborhoods"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.NAME)}
            </Text>
          ))
        }
        zIndex={1}
      />
    </StoryMap>
  ),
};

export const ThousandsOfAreas: Story = {
  name: "Thousands of small areas",
  parameters: {
    sampleMap: "Subdivisions",
    description:
      "Thousands of small tile areas, loaded only for what's in view.",
  },
  render: () => (
    <StoryMap center={[-110.926, 32.2217]} zoom={10}>
      <AreaLayer
        url="data/geojson/tucson_city_limits.json"
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        tiles={{ url: "data/tiles/pima_subdivisions.pmtiles" }}
        color="blue"
        title="Subdivisions"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.SUB_NAME)}
            </Text>
          ))
        }
        zIndex={1}
      />
    </StoryMap>
  ),
};

export const ScatteredAreas: Story = {
  name: "Scattered areas",
  parameters: {
    sampleMap: "Protected lands",
    description:
      "Tile areas over a display-only county outline. Click one for its owner and department in the details.",
  },
  render: () => (
    <StoryMap bounds={[-113.3339, 31.4261, -110.4477, 32.5142]}>
      <AreaLayer
        tiles={{ url: "data/tiles/pima_county.pmtiles" }}
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        tiles={{ url: "data/tiles/protected-lands-pima-county.pmtiles" }}
        color="grass"
        title="Protected lands"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.ONAME1)}
            </Text>
          ))
        }
        renderDialog={(features) =>
          features.map((feature, i) => (
            <DataList.Root key={i} size="1">
              <DataList.Item>
                <DataList.Label>Property</DataList.Label>
                <DataList.Value>{String(feature.ONAME1)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Owner</DataList.Label>
                <DataList.Value>{String(feature.OWNER)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Department</DataList.Label>
                <DataList.Value>{String(feature.DEPT)}</DataList.Value>
              </DataList.Item>
            </DataList.Root>
          ))
        }
        zIndex={1}
      />
    </StoryMap>
  ),
};

// Several area layers overlaid, each with its own color and tooltip. zIndex
// keeps them in order, as same-zIndex layers draw in the order added.
export const StackedAreaLayers: Story = {
  name: "Stacked area layers",
  parameters: {
    sampleMap: "Land use",
    description:
      "Two tile area layers stacked with `zIndex` over a display-only county. Hover where they overlap: the top-most feature wins.",
  },
  render: () => (
    <StoryMap bounds={[-113.3339, 31.4261, -110.4477, 32.5142]}>
      <AreaLayer
        tiles={{ url: "data/tiles/pima_county.pmtiles" }}
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        tiles={{ url: "data/tiles/protected-lands-pima-county.pmtiles" }}
        color="grass"
        title="Protected lands"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.ONAME1)}
            </Text>
          ))
        }
        zIndex={1}
      />
      <AreaLayer
        tiles={{ url: "data/tiles/pima_subdivisions.pmtiles" }}
        color="blue"
        title="Subdivisions"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.SUB_NAME)}
            </Text>
          ))
        }
        zIndex={2}
      />
    </StoryMap>
  ),
};
