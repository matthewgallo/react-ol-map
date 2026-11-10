import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AreaLayer,
  MapLegend,
  MarkerLayer,
  ShadeLegend,
  type FeatureFilter,
  type FeatureProps,
  type MapColor,
  type RangeStyle,
  type Shade,
} from "../src";
import { renderFields, type Fields } from "./support/fields";
import {
  ChildLinks,
  ParentLink,
  useNested,
  useParentMatch,
  withLinks,
} from "./support/nested";
import {
  PAPEL_PICADO_PIN_ANCHOR,
  PapelPicadoPin,
} from "./support/papel-picado-pin";
import {
  CONTIGUOUS_US_BOUNDS,
  PIMA_COUNTY_BOUNDS,
  POINTS,
  tiles,
} from "./support/places";
import { StoryMap } from "./support/story-map";

// Layers drawn within a selected feature of another, as folklorico's maps page
// does with LayerConfig.parent: click a county, district or state to draw its
// divisions, schools or organizations, and move between them with the links
// in the details. Built from useFeatureMap, useLastSelected,
// useLayerFeatures and `filter` (see support/nested.tsx).
const meta = {
  title: "Layers within layers",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

interface CountyDivisionsProps {
  county: string; // tile archives
  divisions: string;
  countyColor: MapColor;
  divisionColor: MapColor;
  shade: Shade & { ranges?: RangeStyle };
  legendTitle: string;
  stats: Fields; // shown for the county and each division
}

// Pima County, and its census county divisions shaded by a statistic. The
// divisions are drawn over the county once it's selected, with a legend.
function CountyDivisions({
  county,
  divisions,
  countyColor,
  divisionColor,
  shade,
  legendTitle,
  stats,
}: CountyDivisionsProps) {
  const nested = useNested("county", "divisions");
  const countyFields = renderFields([["NAMELSAD", "County"], ...stats]);
  const divisionFields = renderFields([["NAME", "Division"], ...stats]);

  return (
    <>
      <AreaLayer
        id="county"
        {...tiles(county)}
        color={countyColor}
        title="County"
        renderTooltip={countyFields}
        renderDialog={withLinks(
          countyFields,
          <ChildLinks
            layerId="divisions"
            nameKey="NAME"
            heading="County divisions"
            color={divisionColor}
          />,
        )}
        zIndex={0}
        // Its highlight goes under the divisions drawn over it
        highlightZIndex={0.5}
        // Only outlined while its shaded divisions are drawn over it, so its
        // fill doesn't throw off their shades
        fill={!nested.parentOpen}
      />
      <AreaLayer
        id="divisions"
        {...tiles(divisions)}
        color={divisionColor}
        title="County divisions"
        shade={shade}
        nested
        visible={nested.childVisible}
        interactive={nested.childInteractive}
        renderTooltip={divisionFields}
        renderDialog={withLinks(
          divisionFields,
          <ParentLink
            hit={nested.parentHit}
            nameKey="NAMELSAD"
            color={countyColor}
          />,
        )}
        zIndex={1}
      />
      <MapLegend>
        {nested.childVisible && (
          <ShadeLegend
            title={legendTitle}
            shade={shade}
            color={divisionColor}
            ranges={shade.ranges}
            layerId="divisions"
          />
        )}
      </MapLegend>
    </>
  );
}

export const PimaPopulation: Story = {
  name: "Pima population (shaded divisions)",
  parameters: {
    description:
      "Maps › Population: click the county to draw its divisions, shaded by population with compact legend ranges (10K–50K).",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <CountyDivisions
        county="pima_county_population"
        divisions="pima_ccd_population"
        countyColor="iris"
        divisionColor="amber"
        shade={{
          key: "gpe_alln_total_pop",
          steps: [10_000, 50_000, 250_000],
          ranges: "compact",
        }}
        legendTitle="Population"
        stats={[
          ["gpe_alln_total_pop", "Population"],
          ["gpe_alln_medianage_yrs", "Median age"],
        ]}
      />
    </StoryMap>
  ),
};

export const PimaForeignBorn: Story = {
  name: "Pima foreign-born (no data hatching)",
  parameters: {
    description:
      "Maps › Foreign-born: only two divisions have data. With `noData`, the rest are hatched, and the legend gets a no data entry.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <CountyDivisions
        county="pima_county_foreign_born"
        divisions="pima_ccd_foreign_born"
        countyColor="cyan"
        divisionColor="orange"
        shade={{
          key: "fbe_total_pop",
          steps: [10_000, 50_000],
          noData: true,
          ranges: "compact",
        }}
        legendTitle="Foreign-born"
        stats={[
          ["fbe_total_pop", "Foreign-born"],
          ["fbe_la_pop", "Born in Latin America"],
        ]}
      />
    </StoryMap>
  ),
};

export const PimaChildren: Story = {
  name: "Pima children",
  parameters: {
    description:
      "Maps › Children: the same county and divisions, shaded by children under 18, with no data for two divisions.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <CountyDivisions
        county="pima_county_children"
        divisions="pima_ccd_children"
        countyColor="blue"
        divisionColor="crimson"
        shade={{
          key: "cce_total_under18",
          steps: [10_000, 50_000],
          noData: true,
          ranges: "compact",
        }}
        legendTitle="Children under 18"
        stats={[
          ["cce_total_under18", "Under 18"],
          ["cce_2ph_under18", "With two parents"],
        ]}
      />
    </StoryMap>
  ),
};

const schoolTooltip = renderFields([
  ["Name", "Name"],
  ["Address", "Address"],
]);
const schoolDetails = renderFields([
  ["Name", "Name"],
  ["District", "School district"],
  ["Address", "Address"],
]);
const districtFields = renderFields([["NAME", "School district"]]);

// Schools without a district boundary of their own, such as colleges
const otherSchools: FeatureFilter = (school) =>
  school.District == null ||
  school.District === "PIMA ACCOMMODATION SCHOOL DISTRICT";

function PimaSchoolLayers() {
  const nested = useNested("school-districts", "schools");
  const ofDistrict = useParentMatch(nested.parentHit, "District", "District");

  return (
    <>
      <AreaLayer
        {...tiles("pima_county_population")}
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        id="school-districts"
        {...tiles("pima_school_districts")}
        color="jade"
        title="School districts"
        renderTooltip={districtFields}
        renderDialog={withLinks(
          districtFields,
          <ChildLinks
            layerId="schools"
            nameKey="Name"
            heading="Schools"
            color="orange"
          />,
        )}
        zIndex={1}
        highlightZIndex={1.5}
      />
      <AreaLayer
        id="schools"
        url={POINTS.tucsonSchools}
        cluster
        color="orange"
        title="Schools"
        nested
        visible={nested.childVisible}
        interactive={nested.childInteractive}
        filter={ofDistrict}
        renderTooltip={schoolTooltip}
        renderDialog={withLinks(
          schoolDetails,
          <ParentLink hit={nested.parentHit} nameKey="NAME" color="jade" />,
        )}
        zIndex={2}
      />
      <AreaLayer
        id="other-schools"
        url={POINTS.tucsonSchools}
        cluster
        color="plum"
        title="Colleges and other schools"
        filter={otherSchools}
        renderTooltip={schoolTooltip}
        renderDialog={schoolDetails}
        zIndex={3}
      />
    </>
  );
}

export const PimaSchools: Story = {
  name: "Pima schools (filtered children)",
  parameters: {
    description:
      "Maps › Schools: click a district to draw its schools, matched by district name with a `filter`, as clustered dots. A second layer filters the same file to schools without a district, always shown.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <PimaSchoolLayers />
    </StoryMap>
  ),
};

const stateFields = renderFields([
  ["NAME", "State"],
  ["Organizations", "Organizations"],
]);
const organizationTooltip = renderFields([
  ["Organization Name", "Name"],
  ["City", "City"],
]);
const organizationDetails = renderFields([
  ["Organization Name", "Name"],
  ["Type", "Type"],
  ["City", "City"],
  ["Founded", "Founded"],
  ["Address", "Address"],
  ["Website", "Website"],
]);
// Heads a selected state's details with its name, in place of "States"
const stateTitle = (features: FeatureProps[]) =>
  features.length === 1 && features[0].NAME
    ? String(features[0].NAME)
    : undefined;

const ORGANIZATION_SHADE: Shade = {
  key: "Organizations",
  // None, 1, 2–4, 5–12 and 13 or more
  steps: [1, 2, 5, 13],
  emptyLowest: true,
};

function UsOrganizationLayers() {
  const nested = useNested("states", "organizations");
  const ofState = useParentMatch(nested.parentHit, "State", "STUSPS");

  return (
    <>
      <AreaLayer
        id="states"
        {...tiles("us_state_folklorico")}
        color="iris"
        shade={ORGANIZATION_SHADE}
        title="States"
        featureTitle={stateTitle}
        renderTooltip={stateFields}
        renderDialog={withLinks(
          stateFields,
          <ChildLinks
            layerId="organizations"
            nameKey="Organization Name"
            heading="Folklórico organizations"
            color="crimson"
          />,
        )}
        zIndex={0}
        highlightZIndex={0.5}
      />
      <MarkerLayer
        id="organizations"
        url={POINTS.usOrganizations}
        cluster
        pin={PapelPicadoPin}
        pinAnchor={PAPEL_PICADO_PIN_ANCHOR}
        color="crimson"
        title="Folklórico organizations"
        visible={nested.childVisible}
        interactive={nested.childInteractive}
        filter={ofState}
        renderTooltip={organizationTooltip}
        renderDialog={withLinks(
          organizationDetails,
          <ParentLink hit={nested.parentHit} nameKey="NAME" color="iris" />,
        )}
      />
      <MapLegend>
        <ShadeLegend
          title="Organizations"
          shade={ORGANIZATION_SHADE}
          color="iris"
          layerId="states"
        />
      </MapLegend>
    </>
  );
}

export const UsOrganizations: Story = {
  name: "US organizations (shaded states, clustered custom pins)",
  parameters: {
    description:
      "Sample maps › US organizations: states shaded by organization count (`emptyLowest` for none), headed by the state's name with `featureTitle`. Click one for its organizations, as clustered papel picado pins.",
  },
  render: () => (
    <StoryMap bounds={CONTIGUOUS_US_BOUNDS}>
      <UsOrganizationLayers />
    </StoryMap>
  ),
};
