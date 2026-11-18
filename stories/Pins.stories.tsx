import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataList, Text } from "@radix-ui/themes";
import { AreaLayer, MarkerLayer } from "../src";
import {
  PAPEL_PICADO_PIN_ANCHOR,
  PapelPicadoPin,
} from "./support/papel-picado-pin";
import { StoryMap } from "./support/story-map";

// MarkerLayer: points drawn as pins, above every area layer. Renders are
// written as a consumer would, since they're shown as the story's code.
const meta = {
  title: "Pins",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PinsWithDetails: Story = {
  name: "Pins with details",
  parameters: {
    sampleMap: "Arizona organizations",
    description:
      "Tile pins across the state, opened with `center` and `zoom`. Their details (click one) show more than their tooltip, with `renderDialog`.",
  },
  render: () => (
    <StoryMap center={[-111.7, 34.2]} zoom={6}>
      <AreaLayer
        url="data/geojson/arizona_boundary.json"
        color="gray"
        interactive={false}
      />
      <MarkerLayer
        tiles={{ url: "data/tiles/arizona_folklorico_organizations.pmtiles" }}
        color="crimson"
        title="Folklórico organizations"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature["Organization Name"])}, {String(feature.City)}
            </Text>
          ))
        }
        renderDialog={(features) =>
          features.map((feature, i) => (
            <DataList.Root key={i} size="1">
              <DataList.Item>
                <DataList.Label>Name</DataList.Label>
                <DataList.Value>
                  {String(feature["Organization Name"])}
                </DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Type</DataList.Label>
                <DataList.Value>{String(feature.Type)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>City</DataList.Label>
                <DataList.Value>{String(feature.City)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Founded</DataList.Label>
                <DataList.Value>{String(feature.Founded)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Address</DataList.Label>
                <DataList.Value>{String(feature.Address)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Website</DataList.Label>
                <DataList.Value>
                  {String(feature["Website/Contact Reference"])}
                </DataList.Value>
              </DataList.Item>
            </DataList.Root>
          ))
        }
      />
    </StoryMap>
  ),
};

// A custom pin component, drawn on the map's canvas as an image. Its code is
// app code, imported in the story's snippet from ./papel-picado-pin.
export const CustomPins: Story = {
  name: "Custom pins",
  parameters: {
    sampleMap: "Arizona organizations",
    description:
      "Tile points drawn with a custom `pin` (a papel picado flag), anchored at its center with `pinAnchor`.",
  },
  render: () => (
    <StoryMap center={[-111.7, 34.2]} zoom={6}>
      <AreaLayer
        url="data/geojson/arizona_boundary.json"
        color="gray"
        interactive={false}
      />
      <MarkerLayer
        tiles={{ url: "data/tiles/arizona_folklorico_organizations.pmtiles" }}
        pin={PapelPicadoPin}
        pinAnchor={PAPEL_PICADO_PIN_ANCHOR}
        color="crimson"
        title="Folklórico organizations"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature["Organization Name"])}
            </Text>
          ))
        }
      />
    </StoryMap>
  ),
};

// Pins from a GeoJSON file over tile areas: pins take priority on hover
export const PinsOverAreas: Story = {
  name: "Pins over areas",
  parameters: {
    sampleMap: "Tucson landmarks",
    description:
      "GeoJSON pins over tile neighborhoods. A pin wins over the area beneath it.",
  },
  render: () => (
    <StoryMap center={[-110.975, 32.19]} zoom={12}>
      <AreaLayer
        url="data/geojson/tucson_city_limits.json"
        color="gray"
        interactive={false}
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
      <MarkerLayer
        url="data/geojson/tucson_landmarks.json"
        color="cyan"
        title="Landmarks"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.name)} (est. {String(feature.established)})
            </Text>
          ))
        }
      />
    </StoryMap>
  ),
};
