import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgMapParser from "./vite-plugin/svg-map-parser";

export default defineConfig({
  plugins: [react(), svgMapParser()],
  root: "src",
  envDir: "../",
  build: {
    outDir: "../dist",
  },
  assetsInclude: ["src/articles/*.md"],
});
