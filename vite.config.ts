import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgMapParser from "./vite-plugin/svg-map-parser";
import { comlink } from "vite-plugin-comlink";

export default defineConfig({
  plugins: [react(), svgMapParser(), comlink()],
  base: process.env.VITE_BASE_URL ?? "/map_of_science/",
  root: "src",
  envDir: "../",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  worker: {
    plugins: () => [comlink()],
  },
  assetsInclude: ["src/articles/*.md"],
});
