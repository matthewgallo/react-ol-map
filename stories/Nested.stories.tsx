import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AreaLayer,
  MapLegend,
  ShadeLegend,
  type FeatureFilter,
  type MapColor,
  type RangeStyle,
  type Shade,
} from "../src";
import { renderFields, type Fields } from "./support/fields";
import { withSnippet } from "./support/render-snippet";
import {
  ChildLinks,
  ParentLink,
  useNested,
  useParentMatch,
  withLinks,
} from "./support/nested";
import {
  OrganizationLinks,
  StateOrganizations,
  stateTitle,
} from "./support/organizations";
import {
  ARIZONA,
  CONTIGUOUS_US_BOUNDS,
  GEOJSON,
  PIMA_COUNTY_BOUNDS,
  POINTS,
  tiles,
} from "./support/places";
import { StoryMap } from "./support/story-map";

// Layers drawn within a selected feature of another, as folklorico's maps page
// does with LayerConfig.parent: click a county or state to draw its areas,
// schools or organizations, and move between them with the links in the
// details. Built from useFeatureMap, useLastSelected,
// useLayerFeatures and `filter` (see support/nested.tsx).
const meta = {
  title: "Layers within layers",
  component: StoryMap,
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof StoryMap>;

export default meta;
type Story = StoryObj<typeof meta>;

interface CountyAreasProps {
  areas: string; // tile archive
  title: string;
  countyColor: MapColor;
  areaColor: MapColor;
  shade: Shade & { ranges?: RangeStyle };
  legendTitle: string;
  fields: Fields; // shown for each area
}

const countyFields = renderFields([["NAMELSAD", "County"]]);

// Pima County, and areas within it shaded by a statistic. The areas are drawn
// over the county once it's selected, with a legend. There are thousands, too
// many to list in the county's details, so only they link back to it.
function CountyAreas({
  areas,
  title,
  countyColor,
  areaColor,
  shade,
  legendTitle,
  fields,
}: CountyAreasProps) {
  const nested = useNested("county", "areas");
  const areaFields = renderFields(fields);

  return (
    <>
      <AreaLayer
        id="county"
        {...tiles("pima_county")}
        color={countyColor}
        title="County"
        renderTooltip={countyFields}
        renderDialog={withSnippet(countyFields)}
        zIndex={0}
        // Its highlight goes under the areas drawn over it
        highlightZIndex={0.5}
        // Only outlined while its shaded areas are drawn over it, so its fill
        // doesn't throw off their shades
        fill={!nested.parentOpen}
      />
      <AreaLayer
        id="areas"
        {...tiles(areas)}
        color={areaColor}
        title={title}
        shade={shade}
        nested
        visible={nested.childVisible}
        interactive={nested.childInteractive}
        renderTooltip={areaFields}
        renderDialog={withSnippet(
          withLinks(
            areaFields,
            <ParentLink
              hit={nested.parentHit}
              nameKey="NAMELSAD"
              color={countyColor}
            />,
          ),
        )}
        zIndex={1}
      />
      <MapLegend>
        {nested.childVisible && (
          <ShadeLegend
            title={legendTitle}
            shade={shade}
            color={areaColor}
            ranges={shade.ranges}
            layerId="areas"
          />
        )}
      </MapLegend>
    </>
  );
}

export const ChoroplethWithinArea: Story = {
  name: "Choropleth within a selected area",
  parameters: {
    sampleMap: "Protected lands",
    description:
      "Click the county to draw its protected lands, shaded by acreage with compact legend ranges (1K–10K).",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <CountyAreas
        areas="protected-lands-pima-county"
        title="Protected lands"
        countyColor="iris"
        areaColor="grass"
        shade={{
          key: "ACRES_GIS",
          steps: [10, 100, 1_000, 10_000],
          ranges: "compact",
        }}
        legendTitle="Acres"
        fields={[
          ["ONAME1", "Property"],
          ["OWNER", "Owner"],
          ["ACRES_GIS", "Acres"],
        ]}
      />
    </StoryMap>
  ),
};

export const ChoroplethNoData: Story = {
  name: "Choropleth with no-data hatching",
  parameters: {
    sampleMap: "Subdivisions",
    description:
      "Click the county to draw its subdivisions, shaded by lot count. With `noData`, the few without a count are hatched (zoom in to see them), and the legend gets a no data entry.",
  },
  render: () => (
    <StoryMap bounds={PIMA_COUNTY_BOUNDS}>
      <CountyAreas
        areas="pima_subdivisions"
        title="Subdivisions"
        countyColor="cyan"
        areaColor="orange"
        shade={{
          key: "LOT_COUNT",
          steps: [10, 50, 250],
          noData: true,
        }}
        legendTitle="Lots"
        fields={[
          ["SUB_NAME", "Subdivision"],
          ["LOT_COUNT", "Lots"],
        ]}
      />
    </StoryMap>
  ),
};

const schoolTooltip = renderFields([
  ["School", "Name"],
  ["Address", "Address"],
]);
const schoolDetails = renderFields([
  ["School", "Name"],
  ["Sector", "Sector"],
  ["Type", "Type"],
  ["Grades", "Grades"],
  ["District", "District"],
  ["County", "County"],
  ["Address", "Address"],
]);

// Bureau of Indian Affairs schools, run on tribal lands rather than by a
// county's districts
const isBia: FeatureFilter = (school) => school.Sector === "BIA";

function PimaSchoolLayers() {
  const nested = useNested("county", "schools");
  const inCounty = useParentMatch(nested.parentHit, "County", "NAME");
  // The selected county's schools, less those the BIA layer always draws
  const ofCounty = useMemo<FeatureFilter>(
    () => (school) => inCounty(school) && !isBia(school),
    [inCounty],
  );

  return (
    <>
      <AreaLayer
        url={GEOJSON.arizonaBoundary}
        color="gray"
        interactive={false}
        zIndex={0}
      />
      <AreaLayer
        id="county"
        {...tiles("pima_county")}
        color="jade"
        title="County"
        renderTooltip={countyFields}
        renderDialog={withSnippet(
          withLinks(
            countyFields,
            <ChildLinks
              layerId="schools"
              nameKey="School"
              heading="Schools"
              color="orange"
            />,
          ),
        )}
        zIndex={1}
        highlightZIndex={1.5}
      />
      <AreaLayer
        id="schools"
        url={POINTS.arizonaSchools}
        cluster
        color="orange"
        title="Schools"
        nested
        visible={nested.childVisible}
        interactive={nested.childInteractive}
        filter={ofCounty}
        renderTooltip={schoolTooltip}
        renderDialog={withLinks(
          schoolDetails,
          <ParentLink hit={nested.parentHit} nameKey="NAMELSAD" color="jade" />,
        )}
        zIndex={2}
      />
      <AreaLayer
        id="bia-schools"
        url={POINTS.arizonaSchools}
        cluster
        color="plum"
        title="Bureau of Indian Affairs schools"
        filter={isBia}
        renderTooltip={schoolTooltip}
        renderDialog={schoolDetails}
        zIndex={3}
      />
    </>
  );
}

export const FilteredDotsWithinArea: Story = {
  name: "Filtered dots within a selected area",
  parameters: {
    sampleMap: "Schools",
    description:
      "Click Pima County to draw its schools, matched by county name with a `filter`, as clustered dots. A second layer filters the same file to the Bureau of Indian Affairs schools, always shown, which the first leaves out.",
  },
  render: () => (
    <StoryMap {...ARIZONA}>
      <PimaSchoolLayers />
    </StoryMap>
  ),
};

const stateFields = renderFields([
  ["NAME", "State"],
  ["Organizations", "Organizations"],
]);
const ORGANIZATION_SHADE: Shade = {
  key: "Organizations",
  // None, 1, 2–4, 5–12 and 13 or more
  steps: [1, 2, 5, 13],
  emptyLowest: true,
};

function UsOrganizationLayers() {
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
        renderDialog={withSnippet(withLinks(stateFields, <OrganizationLinks />))}
        zIndex={0}
        highlightZIndex={0.5}
      />
      <StateOrganizations statesId="states" stateColor="iris" />
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

export const ChoroplethWithClusteredPins: Story = {
  name: "Choropleth with clustered pins within",
  parameters: {
    sampleMap: "US organizations",
    description:
      "States shaded by organization count (`emptyLowest` for none), headed by the state's name with `featureTitle`. Click one for its organizations, as clustered papel picado pins.",
  },
  render: () => (
    <StoryMap bounds={CONTIGUOUS_US_BOUNDS}>
      <UsOrganizationLayers />
    </StoryMap>
  ),
};
