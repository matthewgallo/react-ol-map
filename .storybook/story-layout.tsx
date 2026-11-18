import { Fragment, useEffect, useState, type ReactNode } from "react";
import type { StoryContext } from "@storybook/react-vite";
import { Badge, Box, Code, Flex, Heading, Text } from "@radix-ui/themes";
import { SyntaxHighlighter } from "storybook/internal/components";
import { ThemeProvider, convert } from "storybook/theming";
import { storybookTheme, type Appearance } from "./appearance";
import { storySnippet } from "./source";

// The page around every story: its group and name, which sample map it's
// drawn from (the `sampleMap` parameter), its `description`,
// the map, and its code when it has any to show (its `snippet` parameter, or
// see storySnippet).

// A story's own code, from its args: the `snippet` parameter, for stories
// whose code storySnippet can't make, such as ones built from Controls
export type StorySnippet = (args: StoryContext["args"]) => string | undefined;

// `backticked` spans of a description as inline code
function Description({ text }: { text: string }) {
  return (
    // Box's maxWidth on the paragraph, for a readable line length
    <Box asChild maxWidth="70ch">
      <Text as="p" size="3" color="gray">
        {text.split("`").map((part, i) =>
          i % 2 ? (
            <Code key={i} size="2">
              {part}
            </Code>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
      </Text>
    </Box>
  );
}

function StoryCode({
  source,
  storyName,
  snippet,
  appearance,
}: {
  source?: string;
  storyName: string;
  // The story's own code, in place of one made from its source
  snippet?: string;
  appearance: Appearance;
}) {
  const [generated, setGenerated] = useState<string>();
  useEffect(() => {
    if (snippet !== undefined) return;
    let current = true;
    storySnippet(source, storyName).then(
      (formatted) => current && setGenerated(formatted),
    );
    return () => {
      current = false;
    };
  }, [source, storyName, snippet]);
  const code = snippet ?? generated;
  if (!code) return null;
  return (
    <Flex direction="column" gap="2">
      <Heading as="h2" size="3">
        Code
      </Heading>
      {/* Storybook's highlighter, in its light or dark theme */}
      <ThemeProvider theme={convert(storybookTheme(appearance))}>
        {/* Its text inherits the font size, so a Radix type size sets it */}
        <Text as="div" size="2">
          <SyntaxHighlighter language="jsx" copyable bordered padded>
            {code}
          </SyntaxHighlighter>
        </Text>
      </ThemeProvider>
    </Flex>
  );
}

export function StoryLayout({
  context,
  appearance,
  children,
}: {
  context: StoryContext;
  appearance: Appearance;
  children: ReactNode;
}) {
  const { title, name, parameters } = context;
  const { sampleMap, description, snippet } = parameters as {
    sampleMap?: string;
    description?: string;
    snippet?: StorySnippet;
  };
  return (
    <Flex direction="column" gap="5" p="5" maxWidth="960px" mx="auto">
      <Flex direction="column" gap="2" asChild>
        <header>
          <Text size="2" color="gray" weight="medium">
            {title}
          </Text>
          <Heading as="h1" size="7">
            {name}
          </Heading>
          {sampleMap && (
            <Box>
              <Badge size="2" variant="soft">
                Sample map: {sampleMap}
              </Badge>
            </Box>
          )}
          {description && <Description text={description} />}
        </header>
      </Flex>
      {children}
      <StoryCode
        source={parameters.docs?.source?.originalSource}
        storyName={name}
        snippet={snippet?.(context.args)}
        appearance={appearance}
      />
    </Flex>
  );
}
