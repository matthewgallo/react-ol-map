import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer, MarkerLayer } from "../src";
import { renderFields } from "./support/fields";
import { ARIZONA, GEOJSON, POINTS } from "./support/places";
import { StoryMap } from "./support/story-map";

// `cluster` draws nearby points as one badge with their count. Clicking one
// zooms in until its points separate. It needs every point at once, so only
// works with GeoJSON (`url` or `data`), not tiles.
const meta = {
  title: "Clustering",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const ArizonaBoundary = () => (
  <AreaLayer
    url={GEOJSON.arizonaBoundary}
    color="gray"
    interactive={false}
  />
);

export const ClusteredPins: Story = {
  name: "Arizona libraries (pins)",
  parameters: {
    description:
      "Sample maps › Arizona libraries: clustered GeoJSON pins (`cluster`). Hover a badge for its count, click it to zoom in.",
  },
  render: () => (
    <StoryMap {...ARIZONA}>
      <ArizonaBoundary />
      <MarkerLayer
        url={POINTS.arizonaLibraries}
        cluster
        color="blue"
        title="Libraries"
        renderTooltip={renderFields([
          ["Library", "Name"],
          ["Address", "Address"],
        ])}
      />
    </StoryMap>
  ),
};

export const ClusteredDots: Story = {
  name: "Arizona schools (dots, custom spacing)",
  parameters: {
    description:
      "Sample maps › Arizona schools: thousands of points as clustered dots (an AreaLayer), spaced for the widest badges with `cluster={{ distance: 60, minDistance: 56 }}`.",
  },
  render: () => (
    <StoryMap {...ARIZONA}>
      <ArizonaBoundary />
      <AreaLayer
        url={POINTS.arizonaSchools}
        cluster={{ distance: 60, minDistance: 56 }}
        color="orange"
        title="Schools"
        renderTooltip={renderFields([
          ["School", "Name"],
          ["District", "School district"],
          ["Grades", "Grades"],
        ])}
      />
    </StoryMap>
  ),
};
