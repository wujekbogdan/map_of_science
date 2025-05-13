# map_of_science

## 1.10.0

### Minor Changes

- 6e92d4e: Restore data points colour change on hover
- 2c96369: Restore data points fade in on zoom
- e673394: Drop the last legacy JS code dependency by removing point.js, which also lets us drop the event bus in favor of a more declarative approach using React state and SWR.
- 3888e26: Add the ability to search by data point keywords.
- 3888e26: Multiple performance improvements:

  - Replace several `.filter()` loops with regular `for` loops to allow breaking the loop early when the threshold is hit.
  - Replace `DataPoint` `styled-components` with (S)CSS modules.
  - Replace multiple `DataPoint` instances with a single `DataPoints` component rendering all data points in a single loop.
  - Replace `DataPoint` dynamically generated SVG attributes with a CSS-based solution using CSS `calc()`.
  - Simplify `DataPoint` shape generation by using a single shape for all data points, regardless of the article count.

### Patch Changes

- 10475f7: Reimplement `article.js` in TypeScript.
- 3888e26: Fix a bug causing the parsed map inline styles to include a `-` separator that's incompatible with React - use camelCased CSS properties instead.
- 6e92d4e: Adjust data point tooltip position dynamically to prevent overflow.
- 10475f7: Move all the components to the `components` directory.

## 1.9.0

### Minor Changes

- 0f9ec6c: Install the `@trivago/prettier-plugin-sort-imports` plugin and reformat all the files.
- a340b90: Run build, test, and lint on every push and pull request.

### Patch Changes

- 199871f: Restore the background color while loading the map.
- 11abdc2: bump `@vitejs/plugin-react-swc` to `3.9.0`
- 11abdc2: Bump `vite` to `6.3.5`
- 11abdc2: bump `vitest` to `3.1.3`
- 0f9ec6c: Add `*.ts` and `*.tsx` files to lint-staged configuration to run `prettier` and `eslint` on them.

## 1.8.1

### Patch Changes

- 820bd2b: Fix the styling of the article close button and the zoom controls button.
- 6054aac: restore the `isArticleAvailable()` function

## 1.8.0

### Minor Changes

- e7497a2: Port articles rendering to React
- e7497a2: Add ability to control the number of data points rendered with DevTools
- e7497a2: Port data points rendering to React

## 1.7.0

### Minor Changes

- 2a74b69: - Introduce strongly-typed `keys.tsv`, `data.tsv`, and `labels.tsv"` files parsing.
  - Refactor `points.js` to use th newly introduced parser
- b60bc77: Bring back CSV parsing with Web Workers.
- 91bb5f0: Add an `onClick` handler to map labels. The handler triggers only if the label has a corresponding article.
  This feature _DOES NOT_ bring back articles.
- 3e54b12: Drop the `streaming-tsv-parser.js` CSV parser:

  - Add a generic `csv` parser based on [`csv-parse`](https://www.npmjs.com/package/csv-parse).
  - Use the new parser in `points.js`.

  _Notice_: The new implementation doesn't use Web Workers. This is temporary and will be implemented using Comlink.

### Patch Changes

- b60bc77: Fixed the cities svg behaviour to resize when the window is resized.
- 91bb5f0: Fix a bug causing `VITE_BASE_URL` to be resolved as `undefined` in `vite.config.ts` if the variable was set via an `.env*` file.
  The Vite config now instantiates `dotenv` and parses `.env*` files.

## 1.6.0

### Minor Changes

- 5eff12f: Sync with the original repo. https://github.com/dsonyy/map_of_science/commit/6fd6a437b25c3b35626e03a3991eb6c2e2658722

  - Sync `assets/foreground.svg` https://github.com/dsonyy/map_of_science/commit/b157848365fbbc2aec3c257ab804ca459b6ef1b5
  - Sync `src/articles/fotonika.md` https://github.com/dsonyy/map_of_science/commit/6fd6a437b25c3b35626e03a3991eb6c2e2658722
  - Port Layer 4 labels rendering to React

### Patch Changes

- 5e525e5: Disable search input auto-focus. It’s bad UX because auto-focused input prevents the map's scroll event from working.
- 207fba3: Add a missing `vite-plugin-comlink` dependency

## 1.5.0

### Minor Changes

- 8ee6329:
  - Sync `assets/foreground.svg` with the original repo. https://github.com/dsonyy/map_of_science/commit/d05b22079ddb21a6b87008f999209e7cc0a5ac42
  - Sync `asset/labels.tsv` with the original repo. https://github.com/dsonyy/map_of_science/commit/3c61c313d16cfd1db049acc94d8c1a946e2a89ee
- 8ee6329:
  - Add a search feature. The typeahead search allows users to search through all the map labels. It zooms in and pans the map to the selected label's bounding box.
  - Add plus/minus zoom controls.

## 1.4.0

### Minor Changes

- bb5288f:
  - Drop the original labels implementation that rendered the labels outside the map SVG as absolutely positioned elements.
  - Re-implement the functionality with React, rendering labels within the SVG to simplify positioning and enable dynamic styling.
- 0107cde: Add a Dev Tools widget for dynamic label size adjustment. The widget is disabled by default. To enable it, set the `VITE_DEV_TOOL_ENABLED` environment variable to `true`.

### Patch Changes

- bb5288f: Fix Vite config bugs caused by a non-standard project `root` setting:

  - Set `envDir` to `../`
  - Set `build.outDir` to `../dist`

- bb5288f: Sync `assets/foreground.svg` with the original repo.
  https://github.com/dsonyy/map_of_science/commit/541e0d48131da5564beca1b5748b69138fa8dea4

## 1.3.0

### Minor Changes

- 21717bb:
  - Drop the `vite-plugin-svgr` Vite plugin.
  - Add a Vite plugin `vite-plugin/svg-map-parser` that:
    - Provides a custom loader for SVG files. Files loaded with the `?parse` query parameter are parsed by the plugin.
      Usage: `import map from './map.svg?parse'`.
    - Defines the schema for the SVG map.
    - Parses the given SVG file and validates it against the schema.
    - Returns a strongly typed object with the map data.
  - Add a React-rendered map that utilizes the `vite-plugin/svg-map-parser` plugin. This will allow us to use a
    declarative approach for SVG manipulation rather than direct DOM manipulation. The map is rendered as an SVG element that
    is (mostly) backwards compatible with the previous implementation. The only difference is that the custom
    `inkscape:label` attribute has been replaced with the standard `data-label` attribute.
  - Add [Vitest](https://vitest.dev/).

## 1.2.0

### Minor Changes

- e4836e2: Add Markdown support for articles.

## 1.1.1

### Patch Changes

- 7cb2ad5: Restore the `ArticleListGeneratorPlugin` plugin functionality using [Vite Glob import](https://vite.dev/guide/features#glob-import).

## 1.1.0

### Minor Changes

- 9aad3f6:
  - Add React + TypeScript + Vite
  - Merge the existing ESLint config with the default Vite config to ensure backward compatibility with the existing ESLint rules.
  - Wrap the existing JavaScript code in a React component to enable an incremental migration of the codebase to TypeScript.
  - Replace Webpack with SWC (used by Vite under the hood).
    - Remove the `ArticleListGeneratorPlugin` Webpack plugin and temporarily disable the `ArticleListGenerator` feature.

### Patch Changes

- 1cd925f: Remove a bunch of unused packages from `package.json`:

  - autoprefixer
  - csv-loader
  - eslint-config-prettier
  - eslint-config-standard
  - eslint-plugin-import
  - eslint-plugin-n
  - eslint-plugin-promise
  - postcss-loader
  - sass
  - sass-loader
  - style-loader
  - @d3fc/d3fc-annotation
  - @popperjs/core
  - bootstrap
  - d3-interpolate
  - d3-svg-annotation
  - lodash
  - mini-css-extract-plugin
  - svg-injector

- 19cf5a2: Turn the Release GitHub Workflow into a manually triggered one.
- b9dad5d:
  - Add `Dockerfile`
  - Add `docker-compose.yml`
  - Add corresponding instructions to `README.md`

## 1.0.1

### Patch Changes

- 2b221e6: Update Prettier setup:

  - Run `prettier --write .` via pre-commit hook.
  - Format `package.json` and `*.md` files with Prettier.

  Update ESLint setup:

  - Add the `--fix` flag to the pre-commit hook.

- 6b09a07:
  - Add [commitlint](https://commitlint.js.org/) together with [@commitlint/config-conventional](https://www.npmjs.com/package/@commitlint/config-conventional)
  - Add [Commitizen](https://www.npmjs.com/package/commitizen)
- 753231f: Make the Node.js version explicit by:

  - Updating the `README.md` with the required Node.js version.
  - Specifying the Node.js version in `.nvmrc`.
  - Specifying the Node.js version in `package.json` via the `engines` field.

- 492ea49: Add a GitHub workflow that applies changesets and makes a release on push to `main`.
- 906b33a: Add [Changesets](https://github.com/changesets/changesets)
- 7e5077f: Add node version to `.nvmrc`
