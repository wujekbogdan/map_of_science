/// <reference types="vite/client" />

declare module '*.svg?parse' {
  import { MapSvgRepresentation } from '../vite-plugin/svg-map-parser';
  const content: MapSvgRepresentation
  export default content;
}
