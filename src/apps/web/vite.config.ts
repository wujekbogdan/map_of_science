import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import { comlink } from "vite-plugin-comlink";
import svgMapParser from "./vite-plugin/svg-map-parser";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      checker({
        typescript: {
          root: "./",
          tsconfigPath: "tsconfig.react.json",
        },
      }),
      react(),
      comlink(),
      svgMapParser(),
    ],
    base: env.VITE_BASE_URL,
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
