import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@radix-ui/themes";
import { AreaLayer, MarkerLayer } from "../src";
import { StoryMap } from "./support/story-map";

// `cluster` draws nearby points as one badge with their count. Clicking one
// zooms in until its points separate. It needs every point at once, so only
// works with GeoJSON (`url` or `data`), not tiles. Renders are written as a
// consumer would, since they're shown as the story's code.
const meta = {
  title: "Clustering",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClusteredPins: Story = {
  name: "Clustered pins",
  parameters: {
    sampleMap: "Arizona libraries",
    description:
      "Clustered GeoJSON pins (`cluster`). Hover a badge for its count, click it to zoom in.",
  },
  render: () => (
    <StoryMap center={[-111.7, 34.2]} zoom={6}>
      <AreaLayer
        url="data/geojson/arizona_boundary.json"
        color="gray"
        interactive={false}
      />
      <MarkerLayer
        url="data/points/arizona_libraries.json"
        cluster
        color="blue"
        title="Libraries"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.Library)}
            </Text>
          ))
        }
      />
    </StoryMap>
  ),
};

export const ClusteredDots: Story = {
  name: "Clustered dots (custom spacing)",
  parameters: {
    sampleMap: "Arizona schools",
    description:
      "Thousands of points as clustered dots (an AreaLayer), spaced for the widest badges with `cluster={{ distance: 60, minDistance: 56 }}`.",
  },
  render: () => (
    <StoryMap center={[-111.7, 34.2]} zoom={6}>
      <AreaLayer
        url="data/geojson/arizona_boundary.json"
        color="gray"
        interactive={false}
      />
      <AreaLayer
        url="data/points/arizona_schools.json"
        cluster={{ distance: 60, minDistance: 56 }}
        color="orange"
        title="Schools"
        renderTooltip={(features) =>
          features.map((feature, i) => (
            <Text key={i} as="p" size="2">
              {String(feature.School)} ({String(feature.Grades)})
            </Text>
          ))
        }
      />
    </StoryMap>
  ),
};
