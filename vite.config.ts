import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgMapParser from "./vite-plugin/svg-map-parser";
import { comlink } from "vite-plugin-comlink";
// TODO: Remove before merge
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgMapParser(),
    comlink(),
    svgr({
      svgrOptions: {
        ref: true,
      },
    }),
  ],
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
