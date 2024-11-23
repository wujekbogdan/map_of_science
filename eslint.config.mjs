import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import typeScriptEslint from 'typescript-eslint'
import eslintConfigPrettier from "eslint-config-prettier";

export default typeScriptEslint.config(
  {
    ignores: ['dist'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Legacy configuration for JS files that have not yet been converted to TypeScript
  // TODO: Remove once all JS files are converted to TypeScript
  {
    files: ["src/js/**/*.js"], // Browser-related files
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser, // Enable browser globals like `document` and `window`
      },
    },
  },
  // React/Typescript configuration
  {
    extends: [js.configs.recommended, ...typeScriptEslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    rules: {
      ...eslintConfigPrettier.rules,
    },
  },
)
