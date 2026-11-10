import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaLayer, MarkerLayer } from "../src";
import { renderFields } from "./support/fields";
import {
  PAPEL_PICADO_PIN_ANCHOR,
  PapelPicadoPin,
} from "./support/papel-picado-pin";
import {
  AFFILIATED_SPACES_BOUNDS,
  ARIZONA,
  GEOJSON,
  TUCSON_CITY_BOUNDS,
  tiles,
} from "./support/places";
import { StoryMap } from "./support/story-map";

// MarkerLayer: points drawn as pins, above every area layer
const meta = {
  title: "Pins",
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
  />
);

const ArizonaBoundary = () => (
  <AreaLayer
    url={GEOJSON.arizonaBoundary}
    color="gray"
    interactive={false}
  />
);

export const CommunityGroups: Story = {
  name: "Community groups",
  parameters: {
    description:
      "Maps › Community groups: tile points as default pins over the display-only city limits.",
  },
  render: () => (
    <StoryMap bounds={TUCSON_CITY_BOUNDS}>
      <CityLimits />
      <MarkerLayer
        {...tiles("community_groups_table")}
        color="violet"
        title="Folklórico community groups"
        renderTooltip={renderFields([
          ["Name", "Name"],
          ["Address", "Address"],
        ])}
      />
    </StoryMap>
  ),
};

export const AfterSchoolPrograms: Story = {
  name: "After-school programs",
  parameters: {
    description:
      "Maps › After-school programs: tile pins whose details (click one) show more than their tooltip, with `renderDialog`.",
  },
  render: () => (
    <StoryMap bounds={TUCSON_CITY_BOUNDS}>
      <CityLimits />
      <MarkerLayer
        {...tiles("after_school_programs_table")}
        color="teal"
        title="Folklórico after-school programs"
        renderTooltip={renderFields([
          ["Full Name", "Name"],
          ["Address", "Address"],
        ])}
        renderDialog={renderFields([
          ["Full Name", "Name"],
          ["Level", "Level"],
          ["District", "School district"],
          ["Address", "Address"],
          ["Website", "Website"],
        ])}
      />
    </StoryMap>
  ),
};

// A custom pin component, drawn on the map's canvas as an image
export const AffiliatedSpaces: Story = {
  name: "Affiliated spaces (custom pin)",
  parameters: {
    description:
      "Maps › Affiliated spaces: tile points drawn with a custom `pin` (folklorico's papel picado flag), anchored at its center with `pinAnchor`.",
  },
  render: () => (
    <StoryMap bounds={AFFILIATED_SPACES_BOUNDS}>
      <CityLimits />
      <MarkerLayer
        {...tiles("affiliated_spaces_table")}
        pin={PapelPicadoPin}
        pinAnchor={PAPEL_PICADO_PIN_ANCHOR}
        color="crimson"
        title="Folklórico affiliated spaces"
        renderTooltip={renderFields([
          ["Affiliated Spaces", "Name"],
          ["Address", "Address"],
        ])}
      />
    </StoryMap>
  ),
};

export const ArizonaOrganizations: Story = {
  name: "Arizona organizations",
  parameters: {
    description:
      "Sample maps › Arizona organizations: tile pins across the state, opened with `center` and `zoom`.",
  },
  render: () => (
    <StoryMap {...ARIZONA}>
      <ArizonaBoundary />
      <MarkerLayer
        {...tiles("arizona_folklorico_organizations")}
        color="crimson"
        title="Folklórico organizations"
        renderTooltip={renderFields([
          ["Organization Name", "Name"],
          ["City", "City"],
        ])}
        renderDialog={renderFields([
          ["Organization Name", "Name"],
          ["Type", "Type"],
          ["City", "City"],
          ["Founded", "Founded"],
          ["Address", "Address"],
          ["Website/Contact Reference", "Website"],
        ])}
      />
    </StoryMap>
  ),
};

// Pins from a GeoJSON file over tile areas: pins take priority on hover
export const TucsonLandmarks: Story = {
  name: "Tucson landmarks",
  parameters: {
    description:
      "Sample maps › Tucson landmarks: GeoJSON pins over tile neighborhoods. A pin wins over the area beneath it.",
  },
  render: () => (
    <StoryMap center={[-110.975, 32.19]} zoom={12}>
      <CityLimits />
      <AreaLayer
        {...tiles("tucson_neighborhoods")}
        color="violet"
        title="Neighborhoods"
        renderTooltip={renderFields([["NAME", "Neighborhood"]])}
        zIndex={1}
      />
      <MarkerLayer
        url={GEOJSON.tucsonLandmarks}
        color="cyan"
        title="Landmarks"
        renderTooltip={renderFields([
          ["name", "Name"],
          ["established", "Established"],
        ])}
      />
    </StoryMap>
  ),
};
