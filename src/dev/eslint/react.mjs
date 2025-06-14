import jsEslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tsEslint from "typescript-eslint";

export const defineConfig = () =>
  tsEslint.config(
    jsEslint.configs.recommended,
    tsEslint.configs.recommendedTypeChecked,
    tsEslint.configs.stylisticTypeChecked,
    reactHooks.configs["recommended-latest"],
    reactRefresh.configs.recommended,
    reactRefresh.configs.vite,
    {
      ignores: ["dist"],
    },
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
        },
        ecmaVersion: 2020,
        globals: globals.browser,
      },
    },
    {
      rules: {
        "@typescript-eslint/consistent-type-definitions": "off",
      },
    },
    {
      files: ["**/*.js", "**/*.mjs"],
      extends: [tsEslint.configs.disableTypeChecked],
    },
    eslintConfigPrettier,
  );
