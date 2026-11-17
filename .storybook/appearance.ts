import { themes } from "storybook/theming";

// The toolbar's Theme global, shared by the manager (manager.ts), the docs
// pages and the stories (preview.tsx)
export type Appearance = "light" | "dark";

export const appearanceOf = (globals?: Record<string, unknown>): Appearance =>
  globals?.appearance === "dark" ? "dark" : "light";

// Storybook's own light and dark themes, for its UI and docs pages
export const storybookTheme = (appearance: Appearance) =>
  appearance === "dark" ? themes.dark : themes.light;
