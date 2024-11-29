import { MapSvgRepresentation } from "../vite-plugin/svg-map-parser.ts";
import { svgPathBbox } from "svg-path-bbox";
import { ScaleLinear } from "d3";
import { useStore } from "./store";

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
  color: string;
  x: number;
  y: number;
  text: string;
  fontSize: string | number;
  opacity: number;
};

const Label = (props: Label) => {
  return (
    <text
      display={props.opacity ? "block" : "none"}
      key={props.key}
      textAnchor="middle"
      alignmentBaseline="middle"
      x={props.x}
      y={props.y}
      style={{
        fontSize: props.fontSize,
        fill: props.color,
        opacity: props.opacity,
      }}
    >
      {props.text}
    </text>
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
    // const x = rect.x + rect.width / 2;
    // const y = rect.y + rect.height / 2;

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

  // TODO: Adjust font sizes
  const labels = [
    ...map.layer1.children.map(({ path }) => ({
      ...getLabelPropsByPath(path),
      color: "#995b99",
      fontSize: scaledFontSize.layer1,
      opacity: visibility[0],
    })),
    ...map.layer2.children.map(({ path }) => ({
      ...getLabelPropsByPath(path),
      color: "#393939",
      fontSize: scaledFontSize.layer2,
      opacity: visibility[1],
    })),
    ...map.layer3.groups.flatMap((group) =>
      group.children.map(({ rect }) => ({
        ...getLabelPropsByRect(rect),
        color: "red",
        fontSize: scaledFontSize.layer3,
        opacity: visibility[2],
      })),
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
          <Label {...label} key={label.key} />
        ))}
      </g>
    </svg>
  );
}
