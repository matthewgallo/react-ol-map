import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

// The stories draw folklorico's own data, served as /data like the site does,
// from a folklorico checkout beside this repository
const data = fileURLToPath(
  new URL("../../folklorico/public/data", import.meta.url),
);
if (!existsSync(data)) {
  throw new Error(
    `Storybook reads map data from folklorico, expected at ${data}. Clone matthewgallo/folklorico next to react-ol-map.`,
  );
}

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  staticDirs: [{ from: data, to: "/data" }],
  core: { disableTelemetry: true },
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        // The plugins without the library build settings in vite.config.ts
        viteConfigPath: fileURLToPath(
          new URL("./vite.config.ts", import.meta.url),
        ),
      },
    },
  },
};

export default config;
