import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

// The stories' data, copied from folklorico's public/data and served as /data
// like the site does
const data = fileURLToPath(new URL("../stories/data", import.meta.url));

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  staticDirs: [{ from: data, to: "/data" }],
  // For the Code panel beside Controls (docs.codePanel in preview.tsx)
  addons: ["@storybook/addon-docs"],
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
