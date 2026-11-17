import { addons } from "storybook/manager-api";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { appearanceOf, storybookTheme } from "./appearance";

// Light, with the sidebar's version, until the preview sends the globals
addons.setConfig({ theme: storybookTheme("light") });

// Themes Storybook's own UI (sidebar, toolbar, panels) from the toolbar's
// Theme, as the stories and docs pages are in preview.tsx
addons.register("appearance", (api) => {
  const apply = ({ globals }: { globals?: Record<string, unknown> }) =>
    api.setOptions({ theme: storybookTheme(appearanceOf(globals)) });
  // SET_GLOBALS when the preview starts, GLOBALS_UPDATED on each change
  api.on(SET_GLOBALS, apply);
  api.on(GLOBALS_UPDATED, apply);
});
