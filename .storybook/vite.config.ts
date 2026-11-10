import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The package's plugins, as its build uses, without its library settings
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  // VITE_MAP_KEY from the repository's .env.local (see .env.example)
  envDir: fileURLToPath(new URL("..", import.meta.url)),
});
