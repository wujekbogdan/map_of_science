import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { comlink } from "vite-plugin-comlink";
import svgMapParser from "./vite-plugin/svg-map-parser";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), comlink(), svgMapParser()],
    base: env.VITE_BASE_URL || "/map-of-science/",
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
  };
});
