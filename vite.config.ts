/// <reference types="vitest/config" />
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

// Left for the app to install and bundle, so it gets one copy of each. CSS
// imports from them (react-openlayers' styles) are bundled into styles.css.
const external = [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.dependencies),
];
const isExternal = (id: string) =>
  !id.endsWith(".css") &&
  external.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: "styles",
    },
    sourcemap: true,
    rolldownOptions: {
      external: isExternal,
      // One file per module, so apps only bundle what they use
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        // OpenLayers has no exports map, so Node (SSR, Vitest) only finds its
        // modules with their extension: "ol/Feature.js", not "ol/Feature"
        paths: (id) => (/^ol\/[^.]+$/.test(id) ? `${id}.js` : id),
      },
    },
  },
  test: {
    environment: "jsdom",
    pool: "vmThreads",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
