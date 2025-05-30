/// <reference types="vite/client" />
/// <reference types="vite-plugin-comlink/client" />

type StyleObject = Record<string, string>;

// TODO: This is redundant. The following declaration should be enough:
// declare module '*.svg?parse' {
//   import { MapSvgRepresentation } from '../vite-plugin/svg-map-parser';
//   const content: MapSvgRepresentation;
//   export default content;
// }
// But for some reason, it doesn’t work, even if the ../vite-plugin/svg-map-parser.ts file is included in tsconfig.app.json.

type Cords = {
  x: number;
  y: number;
};

type BoundingBox = {
  min: Cords;
  max: Cords;
  center: Cords;
};

type Path = {
  id: string;
  label: string;
  style: StyleObject;
  d: string;
  boundingBox: {
    min: Cords;
    max: Cords;
    center: Cords;
  };
};

declare module "*.svg?parse" {
  const content: {
    layer1: {
      attributes: {
        id: string;
        label: string;
        style: StyleObject;
      };
      children: {
        path: Path;
      }[];
    };
    layer2: {
      attributes: {
        id: string;
        label: string;
        style: StyleObject;
      };
      children: {
        path: Path;
      }[];
    };
    layer3: {
      attributes: {
        id: string;
        label: string;
        style: StyleObject;
      };
      groups: {
        attributes: {
          id: string;
          label: string;
        };
        children: {
          rect: {
            id: string;
            label: string;
            style: StyleObject;
            width: number;
            height: number;
            x: number;
            y: number;
            boundingBox: BoundingBox;
          };
        }[];
      }[];
    };
  };
  export default content;
}
