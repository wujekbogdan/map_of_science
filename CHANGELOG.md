# map_of_science

## 1.2.0

### Minor Changes

- e4836e2: Add Markdown support for articles.

## 1.1.1

### Patch Changes

- 7cb2ad5: Restore the `ArticleListGeneratorPlugin` plugin functionality using [Vite Glob import](https://vite.dev/guide/features#glob-import).

## 1.1.0

### Minor Changes

- 9aad3f6: - Add React + TypeScript + Vite
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

- 19cf5a2: Turn the Release GitHub Workflow into a manually triggered one
- b9dad5d: - Add `Dockerfile`
  - Add `docker-compose.yml`
  - Add corresponding instructions to `README.md`

## 1.0.1

### Patch Changes

- 2b221e6: Update Prettier setup:

  - Run `prettier --write .` via pre-commit hook.
  - Format `package.json` and `*.md` files with Prettier.

  Update ESLint setup:

  - Add the `--fix` flag to the pre-commit hook.

- 6b09a07: - Add [commitlint](https://commitlint.js.org/) together with [@commitlint/config-conventional](https://www.npmjs.com/package/@commitlint/config-conventional)
  - Add [Commitizen](https://www.npmjs.com/package/commitizen)
- 753231f: Make the Node.js version explicit by:

  - Updating the `README.md` with the required Node.js version.
  - Specifying the Node.js version in `.nvmrc`.
  - Specifying the Node.js version in `package.jso`n via the `engines` field.

- 492ea49: Add a GitHub workflow that applies changesets and makes a release on push to `main`.
- 906b33a: Add [Changesets](https://github.com/changesets/changesets)
- 7e5077f: Add node version to `.nvmrc`
