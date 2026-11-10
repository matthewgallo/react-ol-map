import { useMemo, type ReactNode } from "react";
import { Button, Flex, Heading } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
  useFeatureMap,
  useLastSelected,
  useLayerFeatures,
  type FeatureFilter,
  type Hit,
  type MapColor,
  type Render,
} from "../../src";

// How folklorico's maps page draws a layer within another's features, such as
// a county's divisions or a district's schools (LayerConfig.parent in its
// src/maps/types.ts). Built from the package's useFeatureMap and
// useLastSelected; render the layers in a component inside FeatureMap.

// The child covers its parent, so it's only drawn while the parent's or its
// own details are open. It stays pickable while its feature is selected, so
// closing its details animates out with their content.
export function useNested(parentId: string, childId: string) {
  const { selected, detailsOpen } = useFeatureMap();
  const openOn = detailsOpen ? selected?.layerId : undefined;
  const shown = openOn === parentId || openOn === childId;
  return {
    parentOpen: openOn === parentId,
    childVisible: shown,
    childInteractive: shown || selected?.layerId === childId,
    // The parent feature last selected, kept while its child's details are open
    parentHit: useLastSelected(parentId),
  };
}

// Only the child features whose `key` equals the selected parent feature's
// `parentKey`, such as the schools of the selected district. Memoized, as a
// new filter restyles the layer.
export function useParentMatch(
  parentHit: Hit | undefined,
  key: string,
  parentKey: string,
): FeatureFilter {
  const parentValue = parentHit?.feature.get(parentKey);
  return useMemo(
    () => (props) => parentValue != null && props[key] === parentValue,
    [key, parentValue],
  );
}

const buttonColor = (color: MapColor | undefined) =>
  color === "accent" ? undefined : color;

// Back from a child's details to the parent feature it was reached from
export function ParentLink({
  hit,
  nameKey,
  color,
}: {
  hit: Hit | undefined;
  nameKey: string;
  color?: MapColor;
}) {
  const { select } = useFeatureMap();
  const name = hit?.feature.get(nameKey);
  if (!hit || name == null) return null;
  return (
    <Flex>
      <Button
        variant="ghost"
        size="1"
        color={buttonColor(color)}
        onClick={() => select(hit)}
      >
        <ArrowLeftIcon />
        {String(name)}
      </Button>
    </Flex>
  );
}

// A parent's children in view, each opening its details. Nothing until the
// child layer has drawn them.
export function ChildLinks({
  layerId,
  nameKey,
  heading,
  color,
}: {
  layerId: string;
  nameKey: string;
  heading: string;
  color?: MapColor;
}) {
  const { select } = useFeatureMap();
  const items = useLayerFeatures(layerId)
    .map((feature) => ({ feature, name: feature.get(nameKey) }))
    .filter(({ name }) => name != null && name !== "")
    .map(({ feature, name }) => ({ feature, name: String(name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!items.length) return null;
  return (
    <section>
      <Heading as="h4" size="2" mb="2">
        {heading}
      </Heading>
      <Flex gap="2" wrap="wrap">
        {items.map(({ feature, name }) => (
          <Button
            key={name}
            variant="soft"
            size="1"
            color={buttonColor(color)}
            onClick={() => select({ layerId, feature })}
          >
            {name}
          </Button>
        ))}
      </Flex>
    </section>
  );
}

// Details content with the links above it
export const withLinks =
  (render: Render, links: ReactNode): Render =>
  (features) => (
    <Flex direction="column" gap="4">
      {links}
      {render(features)}
    </Flex>
  );
