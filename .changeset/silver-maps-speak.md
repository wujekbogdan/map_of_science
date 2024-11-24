---
"map_of_science": minor
---

- Drop the `vite-plugin-svgr` Vite plugin.
- Add a Vite plugin `vite-plugin/svg-map-parser` that:
  - Provides a custom loader for SVG files. Files loaded with the `?parse` query parameter are parsed by the plugin.
    Usage: `import map from './map.svg?parse'`.
  - Defines the schema for the SVG map.
  - Parses the given SVG file and validates it against the schema.
  - Returns a strongly typed object with the map data.
- Add a React-rendered map that utilizes the `vite-plugin/svg-map-parser` plugin. The map is rendered as an SVG element that
  is (mostly) backwards compatible with the previous implementation. The only difference is that the custom
  `inkscape:label` attribute has been replaced with the standard `data-label` attribute. This will allow us to use a
  declarative approach for SVG manipulation rather than direct DOM manipulation.
- Add [Vitest](https://vitest.dev/).
