import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AreaLayer,
  MapLegend,
  ShadeLegend,
  type MapColor,
  type RangeStyle,
} from "../src";
import { colorControl } from "./support/controls";
import { renderFields } from "./support/fields";
import { PIMA_COUNTY_BOUNDS, tiles } from "./support/places";
import { StoryMap } from "./support/story-map";

// Pima County's census county divisions, from two of folklorico's maps: every
// division has a population, but only two have foreign-born counts, for
// trying `noData`
const DATASETS = {
  Population: {
    archive: "pima_ccd_population",
    key: "gpe_alln_total_pop",
    label: "Population",
  },
  "Foreign-born (2 divisions with data)": {
    archive: "pima_ccd_foreign_born",
    key: "fbe_total_pop",
    label: "Foreign-born",
  },
};

interface AreaArgs {
  dataset: keyof typeof DATASETS;
  color: MapColor;
  title: string;
  fill: boolean;
  nested: boolean;
  visible: boolean;
  interactive: boolean;
  tooltip: boolean;
  shaded: boolean;
  steps: number[];
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
    dataset: "Population",
    color: "amber",
    title: "County divisions",
    fill: true,
    nested: false,
    visible: true,
    interactive: true,
    tooltip: true,
    shaded: true,
    steps: [10_000, 50_000, 250_000],
    emptyLowest: false,
    noData: false,
    ranges: "compact",
  },
  argTypes: {
    dataset: {
      options: Object.keys(DATASETS),
      control: { type: "inline-radio" },
      description: "Which of folklorico's division tiles to draw (`tiles`).",
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
      description: "The lower bound of each class above the first.",
    },
    emptyLowest: {
      table: { category: "shade" },
      description:
        "The lowest class means none, so it's drawn nearly empty rather than faintest.",
    },
    noData: {
      table: { category: "shade" },
      description:
        "Hatch areas without a value, with a legend entry for them. Try it with the foreign-born dataset.",
    },
    ranges: {
      options: ["count", "compact"],
      control: { type: "inline-radio" },
      table: { category: "shade" },
      description: "How ShadeLegend labels each class: 10,000–49,999 or 10K–50K.",
    },
  },
  parameters: {
    description:
      "AreaLayer's options, in the Controls panel, on Pima County's divisions (from the Population and Foreign-born maps). Hover or click a division: the legend emphasizes its class.",
  },
  render: ({ dataset, tooltip, shaded, steps, emptyLowest, noData, ranges, ...args }) => {
    const { archive, key, label } = DATASETS[dataset];
    const shade = shaded ? { key, steps, emptyLowest, noData } : undefined;
    return (
      <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
        <AreaLayer
          // A new layer for new tiles
          key={archive}
          id="divisions"
          {...tiles(archive)}
          shade={shade}
          renderTooltip={
            tooltip
              ? renderFields([
                  ["NAME", "Division"],
                  [key, label],
                ])
              : undefined
          }
          {...args}
        />
        <MapLegend>
          {shade && (
            <ShadeLegend
              title={label}
              shade={shade}
              color={args.color}
              ranges={ranges}
              // Emphasizes the hovered or selected division's class
              layerId="divisions"
            />
          )}
        </MapLegend>
      </StoryMap>
    );
  },
};
