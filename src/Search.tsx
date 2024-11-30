import { MapSvgRepresentation } from "../vite-plugin/svg-map-parser.ts";

type Props = {
  map: MapSvgRepresentation;
};

export const Search = (props: Props) => {
  const model = props.map.layer1.children.map(({ path }) => ({
    id: path.id,
    label: path.label,
    d: path.d,
  }));
};
