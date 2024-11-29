import { MapSvgRepresentation } from "../vite-plugin/svg-map-parser.ts";
import { svgPathBbox } from "svg-path-bbox";
import { ScaleLinear } from "d3";
import { useStore } from "./store";
import styled from "styled-components";

type Props = {
  map: MapSvgRepresentation;
  scale: {
    x: ScaleLinear<number, number>;
    y: ScaleLinear<number, number>;
  };
  zoom: number;
  visibility: [number, number, number];
};

type Label = {
  key: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  opacity: number;
  level: 1 | 2 | 3;
};

const Label = (props: Label) => {
  return (
    <LabelText
      display={props.opacity ? "block" : "none"}
      key={props.key}
      textAnchor="middle"
      alignmentBaseline="middle"
      x={props.x}
      y={props.y}
      $fontSize={props.fontSize}
      $opacity={props.opacity}
      $level={props.level}
    >
      {props.text}
    </LabelText>
  );
};

export default function Map({ map, visibility, zoom }: Props) {
  const { scaleFactor, fontSize } = useStore();

  const getPathBoundingBoxCenter = (d: string) => {
    const [minx, miny, maxX, maxY] = svgPathBbox(d);

    return {
      x: (minx + maxX) / 2,
      y: (miny + maxY) / 2,
    };
  };

  // TODO: move to the model and display labels conditionally in the JSX rather than rendering an empty text element
  const replaceHash = (str: string) =>
    str.startsWith("#") ? str.replace("#", "") : "";

  const getLabelPropsByPath = (
    path: (typeof map.layer1.children)[number]["path"],
  ) => {
    const { x, y } = getPathBoundingBoxCenter(path.d);

    return {
      key: path.id + path.label,
      x: x,
      y: y,
      text: replaceHash(path.label),
    };
  };

  const getLabelPropsByRect = (
    rect: (typeof map.layer3.groups)[number]["children"][number]["rect"],
  ) => {
    return {
      // The original label.js code uses some kind of scaling here, but it's not clear why.
      // style: {
      //   left: `${scale.x(x)} px}`,
      //   top: `${scale.y(-y)} px}`,
      // },
      key: rect.id + rect.label,
      x: rect.x,
      y: rect.y,
      text: replaceHash(rect.label),
    };
  };

  const scaleFontSize = (size: number) => {
    const baseScaleFactor = 1 / zoom;
    const factor = Math.sqrt(
      Math.min(
        Math.max(scaleFactor.min, zoom * scaleFactor.zoom),
        scaleFactor.max,
      ),
    );

    return size * baseScaleFactor * factor;
  };
  const scaledFontSize = {
    layer1: scaleFontSize(fontSize.layer1),
    layer2: scaleFontSize(fontSize.layer2),
    layer3: scaleFontSize(fontSize.layer3),
  };

  const labels: Label[] = [
    ...map.layer1.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer1,
          opacity: visibility[0],
          level: 1,
        }) as const,
    ),
    ...map.layer2.children.map(
      ({ path }) =>
        ({
          ...getLabelPropsByPath(path),
          fontSize: scaledFontSize.layer2,
          opacity: visibility[1],
          level: 2,
        }) as const,
    ),
    ...map.layer3.groups.flatMap((group) =>
      group.children.map(
        ({ rect }) =>
          ({
            ...getLabelPropsByRect(rect),
            fontSize: scaledFontSize.layer3,
            opacity: visibility[2],
            level: 3,
          }) as const,
      ),
    ),
  ];

  return (
    <svg>
      {/* Layer 1 */}
      <g id={map.layer1.attributes.id} style={map.layer1.attributes.style}>
        {map.layer1.children.map(({ path }) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      {/* Layer 2 */}
      <g id={map.layer2.attributes.id} style={map.layer2.attributes.style}>
        {map.layer2.children.map(({ path }) => (
          <path
            key={path.id}
            id={path.id}
            d={path.d}
            style={path.style}
            data-label={path.label}
          />
        ))}
      </g>

      {/* Layer 3 */}
      <g id={map.layer3.attributes.id} style={map.layer3.attributes.style}>
        {map.layer3.groups.map((group) => (
          <g key={group.attributes.id} id={group.attributes.id}>
            {group.children.map(({ rect }) => (
              <rect
                id={rect.id}
                width={rect.width}
                height={rect.height}
                x={rect.x}
                y={rect.y}
                style={rect.style}
                data-label={rect.label}
              />
            ))}
          </g>
        ))}
      </g>

      <g id="labels">
        {labels.map((label) => (
          <Label {...label} key={label.key} level={label.level} />
        ))}
      </g>
    </svg>
  );
}

const LabelText = styled.text<{
  $opacity: number;
  $fontSize: number;
  $level: 1 | 2 | 3;
}>`
  font-size: ${(props) => props.$fontSize}px;
  opacity: ${(props) => props.$opacity};
  font-weight: bold;
  // TODO: It can be, very likely, replaced with a simplified text-shadow
  text-shadow:
    0 0 1px #f2efe9,
    0 0 2px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9,
    0 0 5px #f2efe9;
  fill: ${(props) => {
    switch (props.$level) {
      case 1:
        return "rgb(153, 91, 153)";
      case 2:
        return "rgb(57, 57, 57)";
      case 3:
        return "rgb(101, 91, 153)";
    }
  }};
`;
