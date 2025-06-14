import jsEslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import nodePlugin from "eslint-plugin-n";
import globals from "globals";
import tsEslint from "typescript-eslint";

export const defineConfig = () =>
  tsEslint.config(
    jsEslint.configs.recommended,
    tsEslint.configs.recommendedTypeChecked,
    tsEslint.configs.stylisticTypeChecked,
    nodePlugin.configs["flat/recommended-script"],
    {
      ignores: ["dist"],
    },
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
        },
        ecmaVersion: 2020,
        globals: globals.node,
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
