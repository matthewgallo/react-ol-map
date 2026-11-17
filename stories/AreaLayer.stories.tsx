import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AreaLayer,
  MapLegend,
  ShadeLegend,
  type MapColor,
  type RangeStyle,
  type ShadeClass,
} from "../src";
import { colorControl } from "./support/controls";
import { renderFields } from "./support/fields";
import { withLinks } from "./support/nested";
import { withSnippet } from "./support/render-snippet";
import {
  OrganizationLinks,
  StateOrganizations,
  stateTitle,
} from "./support/organizations";
import {
  CONTIGUOUS_US_BOUNDS,
  PIMA_COUNTY_BOUNDS,
  TUCSON_CITY_BOUNDS,
  tiles,
} from "./support/places";
import { StoryMap } from "./support/story-map";

interface Dataset {
  source: { tiles: { url: string } } | { url: string };
  key: string; // the shaded value
  label: string;
  nameKey: string;
  name: string;
  bounds: [number, number, number, number];
  steps: number[]; // used unless the steps control is set
  organizations?: boolean; // a selected state draws its organizations
  formatRange?: (shadeClass: ShadeClass) => string; // in place of `ranges`
}

// Classes of yyyymmdd dates, labeled by year rather than as counts
const year = (date: number) => Math.floor(date / 1_00_00);
const yearRange = ({ min, below }: ShadeClass) =>
  min == null
    ? `Before ${year(below!)}`
    : below == null
      ? `${year(min)} on`
      : `${year(min)}–${year(below) - 1}`;

// Data from folklorico's sample maps. Some subdivisions and protected lands
// have no value, for trying `noData`. A selected state draws its
// organizations, as on the US organizations sample map.
const DATASETS: Record<string, Dataset> = {
  "Organizations by state": {
    source: tiles("us_state_folklorico"),
    key: "Organizations",
    label: "Organizations",
    nameKey: "NAME",
    name: "State",
    bounds: CONTIGUOUS_US_BOUNDS,
    steps: [1, 2, 5, 13],
    organizations: true,
  },
  "Lots per subdivision": {
    source: tiles("pima_subdivisions"),
    key: "LOT_COUNT",
    label: "Lots",
    nameKey: "SUB_NAME",
    name: "Subdivision",
    bounds: TUCSON_CITY_BOUNDS,
    steps: [10, 50, 250],
  },
  "Protected lands by acreage": {
    source: tiles("protected-lands-pima-county"),
    key: "ACRES_GIS",
    label: "Acres",
    nameKey: "ONAME1",
    name: "Property",
    bounds: PIMA_COUNTY_BOUNDS,
    steps: [10, 100, 1_000, 10_000],
  },
  // Acquisition dates as yyyymmdd; some are missing or "NA"
  "Protected lands by year acquired": {
    source: tiles("protected-lands-pima-county"),
    key: "ACQDATE",
    label: "Acquired",
    nameKey: "ONAME1",
    name: "Property",
    bounds: PIMA_COUNTY_BOUNDS,
    steps: [1970_00_00, 1990_00_00, 2005_00_00],
    formatRange: yearRange,
  },
};

interface AreaArgs {
  dataset: string;
  color: MapColor;
  title: string;
  fill: boolean;
  nested: boolean;
  visible: boolean;
  interactive: boolean;
  tooltip: boolean;
  shaded: boolean;
  steps?: number[];
  emptyLowest: boolean;
  noData: boolean;
  ranges: RangeStyle;
}

const meta = {
  title: "AreaLayer",
} satisfies Meta<AreaArgs>;

export default meta;
type Story = StoryObj<AreaArgs>;

export const Playground: Story = {
  args: {
    dataset: "Organizations by state",
    color: "indigo",
    title: "Areas",
    fill: true,
    nested: false,
    visible: true,
    interactive: true,
    tooltip: true,
    shaded: true,
    // Unset: each dataset's own classes
    steps: undefined,
    emptyLowest: false,
    noData: false,
    ranges: "count",
  },
  argTypes: {
    dataset: {
      options: Object.keys(DATASETS),
      control: { type: "radio" },
      description:
        "Which of folklorico's sample map tiles to draw (`tiles`).",
    },
    color: {
      ...colorControl,
      description: 'A Radix color scale, or "accent" for the theme\'s.',
    },
    title: { description: "Heads the tooltip and details." },
    fill: {
      description:
        "false draws outlines only, hovered and selected areas too. Unfilled areas can only be picked along their outlines.",
    },
    nested: {
      description:
        "Drawn within another layer's areas: a stronger fill and border.",
    },
    visible: {
      description:
        "A hidden layer ignores hover and clicks, and closes its details if selected.",
    },
    interactive: {
      description:
        "false makes the layer display-only: no hover, tooltip or click.",
    },
    tooltip: {
      description: "Pass `renderTooltip` (details default to it).",
    },
    shaded: {
      table: { category: "shade" },
      description:
        "Pass `shade`: fills each area more strongly the higher its value. The legend shows its scale.",
    },
    steps: {
      control: { type: "object" },
      table: { category: "shade" },
      description:
        "The lower bound of each class above the first. Unset, each dataset's own: organizations 1, 2, 5, 13; lots 10, 50, 250; acres 10, 100, 1,000, 10,000; dates acquired 19700000, 19900000, 20050000 (yyyymmdd).",
    },
    emptyLowest: {
      table: { category: "shade" },
      description:
        "The lowest class means none, so it's drawn nearly empty rather than faintest.",
    },
    noData: {
      table: { category: "shade" },
      description:
        "Hatch areas without a value, with a legend entry for them. Try it with the protected lands by year acquired, or the subdivisions zoomed in.",
    },
    ranges: {
      options: ["count", "compact"],
      control: { type: "inline-radio" },
      table: { category: "shade" },
      description:
        "How ShadeLegend labels each class: 1,000–9,999 or 1K–10K. The dates acquired are labeled as years instead, with `formatRange`.",
    },
  },
  parameters: {
    description:
      "AreaLayer's options, in the Controls panel, on datasets from the sample maps: states, subdivisions, and protected lands by acreage or year acquired. Hover or click an area: the legend emphasizes its class. Click a state for its organizations, drawn within it as clustered pins.",
  },
  render: ({ dataset, tooltip, shaded, steps, emptyLowest, noData, ranges, ...args }) => {
    const {
      source,
      key,
      label,
      nameKey,
      name,
      bounds,
      organizations,
      formatRange,
    } = DATASETS[dataset];
    const shade = shaded
      ? { key, steps: steps ?? DATASETS[dataset].steps, emptyLowest, noData }
      : undefined;
    const fields = renderFields([
      [nameKey, name],
      [key, label],
    ]);
    return (
      // A new map, fitted to the new dataset's bounds
      <StoryMap key={dataset} bounds={bounds}>
        <AreaLayer
          // A new layer for new data
          key={dataset}
          id="areas"
          {...source}
          shade={shade}
          renderTooltip={tooltip ? fields : undefined}
          // A state's details list its organizations, headed by its name
          // Ends with a snippet: how renderDialog gets all of an area's data
          renderDialog={withSnippet(
            organizations ? withLinks(fields, <OrganizationLinks />) : fields,
          )}
          featureTitle={organizations ? stateTitle : undefined}
          zIndex={0}
          // Its highlight goes under the organizations drawn over it
          highlightZIndex={0.5}
          {...args}
        />
        {organizations && (
          <StateOrganizations statesId="areas" stateColor={args.color} />
        )}
        <MapLegend>
          {shade && (
            <ShadeLegend
              title={label}
              shade={shade}
              color={args.color}
              ranges={ranges}
              formatRange={formatRange}
              // Emphasizes the hovered or selected area's class
              layerId="areas"
            />
          )}
        </MapLegend>
      </StoryMap>
    );
  },
};
