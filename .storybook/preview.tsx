import { useEffect } from "react";
import type { Preview, StoryContext } from "@storybook/react-vite";
import { Text, Theme } from "@radix-ui/themes";
import { LocaleContext, type Locale } from "../stories/support/locale";
import { storySource } from "./source";

import "@radix-ui/themes/styles.css";

type Appearance = "light" | "dark";

// folklorico's Theme (src/main.tsx), in the toolbar's appearance. The map
// follows the "dark" class on <html>, as next-themes sets it on the site.
function SiteTheme({
  appearance,
  children,
}: {
  appearance: Appearance;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", appearance === "dark");
  }, [appearance]);
  return (
    <Theme
      appearance={appearance}
      accentColor="crimson"
      grayColor="sand"
      radius="large"
    >
      {children}
    </Theme>
  );
}

const preview: Preview = {
  globalTypes: {
    appearance: {
      description: "Light or dark theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "Language of the map's own text",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "es", title: "Español" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { appearance: "light", locale: "en" },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    // A Code panel beside Controls with each story's source, for consumers:
    // the story's own code, trimmed to what it renders. The panel only runs
    // `transform` on a rendered ("dynamic") snippet, so it's given the
    // story's original source in place of its rendered tree.
    docs: {
      codePanel: true,
      source: {
        type: "dynamic",
        transform: (code: string, context: StoryContext) =>
          storySource(context.parameters.docs?.source?.originalSource ?? code),
      },
    },
    options: {
      // Components with their playgrounds first, then folklorico's maps
      storySort: {
        order: [
          "FeatureMap",
          "AreaLayer",
          "MarkerLayer",
          "Areas",
          "Pins",
          "Clustering",
          "Layers within layers",
        ],
      },
    },
  },
  decorators: [
    // A story's `description` parameter, such as which folklorico map it
    // shows, goes above it
    (Story, { globals, parameters }) => (
      <LocaleContext value={globals.locale as Locale}>
        <SiteTheme appearance={globals.appearance as Appearance}>
          <div style={{ padding: 16, maxWidth: 960, marginInline: "auto" }}>
            {parameters.description && (
              <Text as="p" size="2" color="gray" mb="3">
                {parameters.description}
              </Text>
            )}
            <Story />
          </div>
        </SiteTheme>
      </LocaleContext>
    ),
  ],
};

export default preview;
