/// <reference types="vite/client" />

// TODO: This is redundant. The following declaration should be enough:
// declare module '*.svg?parse' {
//   import { MapSvgRepresentation } from '../vite-plugin/svg-map-parser';
//   const content: MapSvgRepresentation;
//   export default content;
// }
// But for some reason, it doesn’t work, even if the ../vite-plugin/svg-map-parser.ts file is included in tsconfig.app.json.
declare module "*.svg?parse" {
  const content: {
    layer1: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      paths: {
        id: string;
        label: string;
        style: object;
        d: string;
      }[];
    };
    layer2: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      paths: {
        id: string;
        label: string;
        style: object;
        d: string;
      }[];
    };
    layer3: {
      attributes: {
        id: string;
        label: string;
        style: object;
      };
      groups: {
        attributes: {
          id: string;
          label: string;
        };
        rects: {
          id: string;
          label: string;
          style: object;
          width: string;
          height: string;
          x: string;
          y: string;
        }[];
      }[];
    };
  };
  export default content;
}
