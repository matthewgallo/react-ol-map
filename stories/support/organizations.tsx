import { MarkerLayer, type FeatureProps, type MapColor } from "../../src";
import { renderFields } from "./fields";
import {
  ChildLinks,
  ParentLink,
  useNested,
  useParentMatch,
  withLinks,
} from "./nested";
import { PAPEL_PICADO_PIN_ANCHOR, PapelPicadoPin } from "./papel-picado-pin";
import { POINTS } from "./places";

// The US organizations sample map's organizations, drawn within a selected
// state of the us_state_folklorico tiles

const ORGANIZATIONS_ID = "organizations";

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

// Heads a selected state's details with its name, in place of the layer title
export const stateTitle = (features: FeatureProps[]) =>
  features.length === 1 && features[0].NAME
    ? String(features[0].NAME)
    : undefined;

// The selected state's organizations, for its details
export const OrganizationLinks = () => (
  <ChildLinks
    layerId={ORGANIZATIONS_ID}
    nameKey="Organization Name"
    heading="Folklórico organizations"
    color="crimson"
  />
);

// The selected state's organizations as clustered papel picado pins, matched
// by two-letter state code. Render inside FeatureMap.
export function StateOrganizations({
  statesId,
  stateColor,
}: {
  statesId: string;
  stateColor: MapColor;
}) {
  const nested = useNested(statesId, ORGANIZATIONS_ID);
  const ofState = useParentMatch(nested.parentHit, "State", "STUSPS");

  return (
    <MarkerLayer
      id={ORGANIZATIONS_ID}
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
        <ParentLink hit={nested.parentHit} nameKey="NAME" color={stateColor} />,
      )}
    />
  );
}
