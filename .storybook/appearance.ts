import { create, themes } from "storybook/theming";
import pkg from "../package.json";

// The toolbar's Theme global, shared by the manager (manager.ts), the docs
// pages and the stories (preview.tsx)
export type Appearance = "light" | "dark";

export const appearanceOf = (globals?: Record<string, unknown>): Appearance =>
  globals?.appearance === "dark" ? "dark" : "light";

// Storybook's own light and dark themes, for its UI and docs pages, with the
// package's name and version atop the sidebar, linking to its repository
export const storybookTheme = (appearance: Appearance) =>
  create({
    ...(appearance === "dark" ? themes.dark : themes.light),
    brandTitle: `react-ol-map v${pkg.version}`,
    brandUrl: "https://github.com/matthewgallo/react-ol-map",
    brandTarget: "_blank",
  });
