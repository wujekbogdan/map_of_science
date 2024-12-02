import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgMapParser from "./vite-plugin/svg-map-parser";
import { comlink } from "vite-plugin-comlink";

export default defineConfig({
  plugins: [react(), svgMapParser(), comlink()],
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
