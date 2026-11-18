import { useEffect, useState } from "react";
import type { Preview, StoryContext } from "@storybook/react-vite";
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { Theme } from "@radix-ui/themes";
import { appearanceOf, storybookTheme, type Appearance } from "./appearance";
import { LocaleContext, type Locale } from "../stories/support/locale";
import { storySource } from "./source";
import { StoryLayout, type StorySnippet } from "./story-layout";

import "@radix-ui/themes/styles.css";

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
      // Fills the canvas below the story with the theme's background
      style={{ minHeight: "100vh" }}
    >
      {children}
    </Theme>
  );
}

// Docs pages (Welcome) in Storybook's light or dark theme, following the
// toolbar's Theme. Decorators don't run on docs pages, so this listens for the
// globals itself.
function ThemedDocsContainer(props: DocsContainerProps) {
  const { channel } = props.context;
  const [appearance, setAppearance] = useState<Appearance>(() =>
    appearanceOf(
      // The globals so far; not in DocsContextProps' type
      (
        props.context as {
          store?: { userGlobals?: { get(): Record<string, unknown> } };
        }
      ).store?.userGlobals?.get(),
    ),
  );
  useEffect(() => {
    const update = ({ globals }: { globals?: Record<string, unknown> }) =>
      setAppearance(appearanceOf(globals));
    channel.on(SET_GLOBALS, update);
    channel.on(GLOBALS_UPDATED, update);
    return () => {
      channel.off(SET_GLOBALS, update);
      channel.off(GLOBALS_UPDATED, update);
    };
  }, [channel]);
  return <DocsContainer {...props} theme={storybookTheme(appearance)} />;
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
      container: ThemedDocsContainer,
      codePanel: true,
      source: {
        type: "dynamic",
        transform: (code: string, context: StoryContext) =>
          (context.parameters.snippet as StorySnippet | undefined)?.(
            context.args,
          ) ??
          storySource(context.parameters.docs?.source?.originalSource ?? code),
      },
    },
    options: {
      // The Welcome page, components with their playgrounds, then
      // folklorico's maps
      storySort: {
        order: [
          "Welcome",
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
    // Each story in the shared page layout: header, description, map, code
    (Story, context) => (
      <LocaleContext value={context.globals.locale as Locale}>
        <SiteTheme appearance={appearanceOf(context.globals)}>
          <StoryLayout
            context={context}
            appearance={appearanceOf(context.globals)}
          >
            <Story />
          </StoryLayout>
        </SiteTheme>
      </LocaleContext>
    ),
  ],
};

export default preview;
