import { Box, Code, Flex, Separator, Text } from "@radix-ui/themes";
import type { Render } from "../../src";

// A short example under a layer's details: how a consumer's `renderDialog`
// gets every property of the clicked area
const SNIPPET = `<AreaLayer
  renderDialog={(features) => (
    // One object per clicked area,
    // with all of its properties
    <pre>
      {JSON.stringify(
        features[0], null, 2
      )}
    </pre>
  )}
/>`;

function RenderSnippet() {
  return (
    <Flex direction="column" gap="2">
      <Separator size="4" />
      <Text size="1" color="gray">
        These details come from <Code size="1">renderDialog</Code>. To get all of an
        area's data:
      </Text>
      <Box
        asChild
        p="2"
        style={{
          margin: 0,
          overflowX: "auto",
          borderRadius: "var(--radius-2)",
          background: "var(--gray-a3)",
          fontFamily: "var(--code-font-family)",
          fontSize: "var(--font-size-1)",
          lineHeight: 1.5,
        }}
      >
        <pre>{SNIPPET}</pre>
      </Box>
    </Flex>
  );
}

// The details, with the snippet under them
export const withSnippet =
  (render: Render): Render =>
  (features) => (
    <Flex direction="column" gap="3">
      {render(features)}
      <RenderSnippet />
    </Flex>
  );
